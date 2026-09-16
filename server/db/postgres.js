require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

// Read configuration from environment or stored AWS config (prioritizing AWS RDS PostgreSQL)
let awsStoredConfig = {};
try {
  const awsConfigFile = path.resolve(__dirname, "../data/aws_server_config.json");
  if (fs.existsSync(awsConfigFile)) {
    awsStoredConfig = JSON.parse(fs.readFileSync(awsConfigFile, "utf8")) || {};
  }
} catch (e) {}

const rawDbUrl = (process.env.AWS_RDS_URL || process.env.DATABASE_URL || "").trim();
const rawHostFromUrl = rawDbUrl && !rawDbUrl.includes("://") ? rawDbUrl : null;

const sqlHost = process.env.DB_HOST || process.env.AWS_RDS_HOST || awsStoredConfig.rdsHost || rawHostFromUrl || process.env.SQL_HOST || process.env.PGHOST || "localhost";
const sqlPort = parseInt(process.env.DB_PORT || process.env.AWS_RDS_PORT || awsStoredConfig.rdsPort || process.env.SQL_PORT || process.env.PGPORT || "5432", 10);
const sqlDb = process.env.DB_NAME || process.env.AWS_RDS_DB || awsStoredConfig.rdsDatabase || process.env.SQL_DB_NAME || process.env.PGDATABASE || "avahire_db";
const sqlUser = process.env.DB_USER || process.env.AWS_RDS_USER || awsStoredConfig.rdsUser || process.env.SQL_USER || process.env.PGUSER || "postgres";
const sqlPassword = process.env.DB_PASSWORD || process.env.AWS_RDS_PASSWORD || awsStoredConfig.rdsPassword || process.env.SQL_PASSWORD || process.env.PGPASSWORD || "";
const databaseUrl = process.env.AWS_RDS_URL || process.env.DATABASE_URL;

// Normalize DATABASE_URL and strip accidental bracket wrappers if entered from template [PASSWORD]
function getCleanDatabaseUrl() {
  const rawUrl =
    process.env.AWS_RDS_URL ||
    process.env.DATABASE_URL ||
    (process.env.SQL_USER && process.env.SQL_USER.startsWith("postgresql://")
      ? process.env.SQL_USER
      : null);
  if (!rawUrl) return null;
  // If not starting with postgresql:// or postgres://, treat as host, not a full connection URI
  if (!rawUrl.startsWith("postgresql://") && !rawUrl.startsWith("postgres://")) {
    return null;
  }
  try {
    const u = new URL(rawUrl);
    let pw = decodeURIComponent(u.password);
    if (pw.startsWith("[") && pw.endsWith("]")) {
      pw = pw.slice(1, -1);
    }
    return `${u.protocol}//${u.username}:${encodeURIComponent(pw)}@${u.host}${u.pathname}`;
  } catch {
    return rawUrl;
  }
}

// Local file-based fallback database for offline/development resilience
const DATA_DIR = path.resolve(__dirname, "../data");
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (e) {
    // Ignore error if already exists
  }
}

const USERS_FILE = path.join(DATA_DIR, "postgres_users_mirror.json");
const TOKENS_FILE = path.join(DATA_DIR, "postgres_verification_tokens_mirror.json");

function readJson(file) {
  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
  }
  return [];
}

function writeJson(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error(`Error writing ${file}:`, err);
  }
}

let pool = null;
let pgConnected = false;

// Create pool lazily
function getPool() {
  if (!pool) {
    const cleanUrl = getCleanDatabaseUrl();
    const isCloudPostgres = Boolean(
      cleanUrl && (
        cleanUrl.includes("supabase.co") ||
        cleanUrl.includes("supabase.com") ||
        cleanUrl.includes("neon.tech") ||
        cleanUrl.includes("sslmode=require") ||
        !cleanUrl.includes("localhost")
      )
    );

    const isAwsRds = Boolean(sqlHost && sqlHost.includes("rds.amazonaws.com"));
    const isRemote = Boolean(sqlHost && !sqlHost.includes("localhost") && !sqlHost.includes("127.0.0.1"));

    const poolConfig = cleanUrl
      ? {
          connectionString: cleanUrl,
          ssl: isCloudPostgres ? { rejectUnauthorized: false } : undefined,
          max: 10,
          connectionTimeoutMillis: 10000,
        }
      : {
          host: sqlHost,
          port: sqlPort,
          database: sqlDb,
          user: sqlUser,
          password: sqlPassword,
          ssl: (isAwsRds || isRemote) ? { rejectUnauthorized: false } : undefined,
          max: 10,
          connectionTimeoutMillis: 10000,
        };

    pool = new Pool(poolConfig);

    pool.on("error", (err) => {
      console.warn("PostgreSQL pool idle client warning:", err.message);
    });
  }
  return pool;
}

// Initialize tables in PostgreSQL
async function initTables() {
  const p = getPool();
  try {
    const client = await p.connect();
    try {
      // 1. Users table
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          full_name VARCHAR(255) NOT NULL,
          password_hash VARCHAR(255),
          company VARCHAR(255),
          website VARCHAR(255),
          designation VARCHAR(255),
          phone VARCHAR(100),
          is_verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 2. Verification tokens table
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.verification_tokens (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          token VARCHAR(255) UNIQUE NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          used_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 3. SMTP sent emails table for permanent email storage
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.smtp_emails (
          id SERIAL PRIMARY KEY,
          message_id VARCHAR(255),
          recipient VARCHAR(255) NOT NULL,
          recipient_name VARCHAR(255),
          sender_email VARCHAR(255),
          user_email VARCHAR(255),
          subject TEXT NOT NULL,
          body TEXT,
          html TEXT,
          email_type VARCHAR(100) DEFAULT 'general',
          template_id VARCHAR(100),
          status VARCHAR(100) DEFAULT 'Delivered',
          delivery_mode VARCHAR(100) DEFAULT 'smtp',
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 4. Jobs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.jobs (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          dept VARCHAR(255),
          job_level VARCHAR(100),
          reports_to VARCHAR(255),
          loc VARCHAR(255),
          is_remote_position BOOLEAN DEFAULT FALSE,
          work_mode VARCHAR(100),
          type VARCHAR(100),
          exp_level VARCHAR(100),
          description TEXT,
          key_skills JSONB DEFAULT '[]'::jsonb,
          candidates INTEGER DEFAULT 0,
          status VARCHAR(100) DEFAULT 'Active',
          created_by VARCHAR(255),
          user_email VARCHAR(255),
          posted VARCHAR(100),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 5. Candidates table
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.candidates (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          phone VARCHAR(100),
          role VARCHAR(255),
          avatar TEXT,
          interview_date VARCHAR(255),
          timestamp VARCHAR(100),
          duration VARCHAR(100),
          mode VARCHAR(100),
          score NUMERIC,
          status VARCHAR(100) DEFAULT 'Under Review',
          notes TEXT,
          summary_points JSONB DEFAULT '[]'::jsonb,
          recommendation TEXT,
          transcript JSONB DEFAULT '[]'::jsonb,
          evaluation_breakdown JSONB DEFAULT '[]'::jsonb,
          created_by VARCHAR(255),
          user_email VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 6. Interviews table
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.interviews (
          id VARCHAR(255) PRIMARY KEY,
          candidate_id VARCHAR(255),
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          avatar TEXT,
          role VARCHAR(255),
          company VARCHAR(255),
          date VARCHAR(100),
          day_of_week VARCHAR(100),
          time VARCHAR(100),
          time_zone VARCHAR(100),
          duration VARCHAR(100),
          duration_mins INTEGER DEFAULT 45,
          link_code VARCHAR(100),
          status VARCHAR(100) DEFAULT 'Scheduled',
          expiry VARCHAR(100),
          expiry_time VARCHAR(100),
          is_expired BOOLEAN DEFAULT FALSE,
          score NUMERIC,
          created_by VARCHAR(255),
          user_email VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 7. Resumes table
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.resumes (
          id VARCHAR(255) PRIMARY KEY,
          candidate_id VARCHAR(255),
          name VARCHAR(255),
          email VARCHAR(255),
          phone VARCHAR(100),
          location VARCHAR(255),
          role VARCHAR(255),
          target_job_id VARCHAR(255),
          target_job_title VARCHAR(255),
          field VARCHAR(100),
          domain VARCHAR(100),
          score NUMERIC,
          ats_score NUMERIC,
          match_score NUMERIC,
          skills_match_pct NUMERIC,
          status VARCHAR(100) DEFAULT 'Review',
          skills JSONB DEFAULT '[]'::jsonb,
          all_skills JSONB DEFAULT '[]'::jsonb,
          secondary_domains JSONB DEFAULT '[]'::jsonb,
          matched_skills JSONB DEFAULT '[]'::jsonb,
          missing_skills JSONB DEFAULT '[]'::jsonb,
          missing_required_skills JSONB DEFAULT '[]'::jsonb,
          missing_preferred_skills JSONB DEFAULT '[]'::jsonb,
          experience VARCHAR(100),
          exp_years NUMERIC DEFAULT 0,
          experience_entries JSONB DEFAULT '[]'::jsonb,
          education TEXT,
          education_entries JSONB DEFAULT '[]'::jsonb,
          summary TEXT,
          breakdown JSONB DEFAULT '{}'::jsonb,
          ai_analysis JSONB DEFAULT '{}'::jsonb,
          resume_data JSONB DEFAULT '{}'::jsonb,
          key_points JSONB DEFAULT '{}'::jsonb,
          raw_text TEXT,
          resume_file_name VARCHAR(255),
          file_url TEXT,
          created_by VARCHAR(255),
          user_email VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Safe column migrations if table already exists
        ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS location VARCHAR(255);
        ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS ats_score NUMERIC;
        ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS match_score NUMERIC;
        ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS skills_match_pct NUMERIC;
        ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS secondary_domains JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS all_skills JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS experience_entries JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS education_entries JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS missing_required_skills JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS missing_preferred_skills JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS breakdown JSONB DEFAULT '{}'::jsonb;
        ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS ai_analysis JSONB DEFAULT '{}'::jsonb;
        ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS resume_data JSONB DEFAULT '{}'::jsonb;
      `);

      // 8. Email templates table
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.email_templates (
          id SERIAL PRIMARY KEY,
          template_key VARCHAR(100),
          name VARCHAR(255) NOT NULL,
          subject TEXT NOT NULL,
          body TEXT NOT NULL,
          category VARCHAR(100),
          uses INTEGER DEFAULT 0,
          created_by VARCHAR(255),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 9. Email sent logs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.email_sent (
          id VARCHAR(255) PRIMARY KEY,
          recipient VARCHAR(255) NOT NULL,
          recipient_name VARCHAR(255),
          sender_email VARCHAR(255),
          user_email VARCHAR(255),
          created_by VARCHAR(255),
          subject TEXT NOT NULL,
          body TEXT,
          html TEXT,
          type VARCHAR(100) DEFAULT 'General',
          template_id VARCHAR(100),
          opened BOOLEAN DEFAULT FALSE,
          opened_at TIMESTAMP WITH TIME ZONE,
          sent_at VARCHAR(100),
          status VARCHAR(100) DEFAULT 'Delivered',
          delivery_mode VARCHAR(100) DEFAULT 'smtp',
          message_id VARCHAR(255),
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 10. App settings table
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.app_settings (
          setting_key VARCHAR(100) PRIMARY KEY,
          setting_data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 11. Candidate portal sessions table
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.candidate_portal_sessions (
          id VARCHAR(255) PRIMARY KEY,
          link_code VARCHAR(100),
          candidate_name VARCHAR(255),
          candidate_email VARCHAR(255),
          candidate_phone VARCHAR(100),
          role VARCHAR(255),
          company VARCHAR(255),
          status VARCHAR(100),
          system_check_status JSONB DEFAULT '{}'::jsonb,
          overall_score NUMERIC,
          tech_depth_score VARCHAR(100),
          clarity_score VARCHAR(100),
          recommendation TEXT,
          elapsed_seconds INTEGER DEFAULT 0,
          transcripts JSONB DEFAULT '[]'::jsonb,
          evaluation_breakdown JSONB DEFAULT '[]'::jsonb,
          completed_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 12. App collections table (generic JSONB collections table)
      await client.query(`
        CREATE TABLE IF NOT EXISTS public.app_collections (
          collection_name VARCHAR(100) PRIMARY KEY,
          data JSONB NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Create indexes for faster token, email, job, candidate, and interview lookups
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON public.verification_tokens(token);
        CREATE INDEX IF NOT EXISTS idx_verification_tokens_email ON public.verification_tokens(email);
        CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
        CREATE INDEX IF NOT EXISTS idx_smtp_emails_recipient ON public.smtp_emails(recipient);
        CREATE INDEX IF NOT EXISTS idx_smtp_emails_user_email ON public.smtp_emails(user_email);
        CREATE INDEX IF NOT EXISTS idx_smtp_emails_type ON public.smtp_emails(email_type);
        CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
        CREATE INDEX IF NOT EXISTS idx_jobs_user_email ON public.jobs(user_email);
        CREATE INDEX IF NOT EXISTS idx_candidates_user_email ON public.candidates(user_email);
        CREATE INDEX IF NOT EXISTS idx_candidates_status ON public.candidates(status);
        CREATE INDEX IF NOT EXISTS idx_interviews_link_code ON public.interviews(link_code);
        CREATE INDEX IF NOT EXISTS idx_interviews_user_email ON public.interviews(user_email);
        CREATE INDEX IF NOT EXISTS idx_resumes_job_id ON public.resumes(target_job_id);
        CREATE INDEX IF NOT EXISTS idx_candidate_sessions_link_code ON public.candidate_portal_sessions(link_code);
        CREATE INDEX IF NOT EXISTS idx_email_sent_user_email ON public.email_sent(user_email);
      `);

      // Sync any registered mirror users to PostgreSQL public.users
      try {
        const localUsers = readJson(USERS_FILE);
        for (const u of localUsers) {
          if (u && u.email) {
            const pw = u.passwordHash || u.password_hash || null;
            await client.query(`
              INSERT INTO public.users (email, full_name, password_hash, company, website, designation, phone, is_verified)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              ON CONFLICT (email) DO UPDATE
              SET password_hash = COALESCE(EXCLUDED.password_hash, public.users.password_hash),
                  full_name = COALESCE(EXCLUDED.full_name, public.users.full_name),
                  is_verified = TRUE;
            `, [
              u.email.toLowerCase(),
              u.fullName || u.name || "",
              pw,
              u.company || "",
              u.website || "",
              u.designation || "",
              u.phone || "",
              true,
            ]);
          }
        }

        // Pull ALL live PostgreSQL users down to local mirrors to guarantee 100% data consistency
        const allPgUsers = await client.query(`
          SELECT id, email, full_name, password_hash, company, website, designation, phone, is_verified, created_at, updated_at
          FROM public.users
          ORDER BY id ASC
        `);

        if (allPgUsers.rows && allPgUsers.rows.length > 0) {
          // Update all unverified users to verified so no user gets locked out
          await client.query(`UPDATE public.users SET is_verified = TRUE WHERE is_verified IS NOT TRUE`);

          const mergedUsers = [...localUsers];
          for (const row of allPgUsers.rows) {
            const cEmail = row.email.toLowerCase();
            const existingIdx = mergedUsers.findIndex(u => u.email && u.email.toLowerCase() === cEmail);
            const userObj = {
              id: row.id,
              uid: `usr_${row.id}`,
              email: cEmail,
              fullName: row.full_name,
              name: row.full_name,
              company: row.company || "AvaHire",
              website: row.website || "",
              designation: row.designation || "HR Administrator",
              phone: row.phone || "",
              passwordHash: row.password_hash,
              password_hash: row.password_hash,
              isVerified: true,
              createdAt: row.created_at || new Date().toISOString(),
              updatedAt: row.updated_at || new Date().toISOString(),
            };

            if (existingIdx >= 0) {
              mergedUsers[existingIdx] = { ...mergedUsers[existingIdx], ...userObj };
            } else {
              mergedUsers.push(userObj);
            }
          }
          writeJson(USERS_FILE, mergedUsers);

          // Also mirror into users.json
          const defaultUsersFile = path.join(DATA_DIR, "users.json");
          const defaultUsersList = readJson(defaultUsersFile);
          for (const mUser of mergedUsers) {
            const dIdx = defaultUsersList.findIndex(u => u.email && u.email.toLowerCase() === mUser.email.toLowerCase());
            const dUserObj = {
              id: mUser.id,
              uid: mUser.uid || `usr_${mUser.id}`,
              name: mUser.fullName || mUser.name,
              email: mUser.email,
              avatar: mUser.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
              role: mUser.role || "recruiter",
              company: mUser.company || "AvaHire",
              designation: mUser.designation || "HR Administrator",
              phone: mUser.phone || "",
              password_hash: mUser.passwordHash || mUser.password_hash,
              created_at: mUser.createdAt,
            };
            if (dIdx >= 0) {
              defaultUsersList[dIdx] = { ...defaultUsersList[dIdx], ...dUserObj };
            } else {
              defaultUsersList.push(dUserObj);
            }
          }
          writeJson(defaultUsersFile, defaultUsersList);
        }
      } catch (syncErr) {
        console.warn("PostgreSQL user sync notice:", syncErr.message);
      }

      // Sync resumes between PostgreSQL and local storage
      try {
        const resumesFile = path.join(DATA_DIR, "resumes.json");
        const localResumes = readJson(resumesFile);

        // Delete any legacy sample resumes so Resume Screener starts empty
        await client.query(`
          DELETE FROM public.resumes 
          WHERE id IN ('c-1001', 'c-1002', 'c-1003', 'c-1004', 'c-1005', 'c-1006')
             OR id LIKE 'c-100%'
             OR email LIKE '%@example.com';
        `).catch(err => console.warn("Notice cleaning sample resumes:", err.message));

        // Also clean any sample interview candidates
        await client.query(`
          DELETE FROM public.candidates
          WHERE id = 'cand-1789141858939' 
             OR id LIKE 'cand-sample%' 
             OR name = 'hina';
        `).catch(err => console.warn("Notice cleaning sample candidates:", err.message));

        // Clean sample records from app_collections
        await client.query(`
          UPDATE public.app_collections 
          SET data = '[]'::jsonb 
          WHERE collection_name = 'resumes' AND data::text LIKE '%c-1001%';
        `).catch(() => {});

        // Seed any non-sample manually uploaded resumes to PostgreSQL if missing
        if (Array.isArray(localResumes) && localResumes.length > 0) {
          for (const r of localResumes) {
            if (!r || !r.id) continue;
            // Never seed preloaded/sample candidates
            if (r.id.startsWith("c-100") || (r.email && r.email.endsWith("@example.com"))) continue;
            await client.query(`
              INSERT INTO public.resumes (
                id, candidate_id, name, email, phone, location, role,
                target_job_id, target_job_title, field, domain, score,
                ats_score, match_score, skills_match_pct, status, skills,
                all_skills, secondary_domains, matched_skills, missing_skills,
                missing_required_skills, missing_preferred_skills, experience,
                exp_years, experience_entries, education, education_entries,
                summary, breakdown, ai_analysis, resume_data, key_points,
                raw_text, resume_file_name, file_url, created_at, updated_at
              ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
                $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28,
                $29, $30, $31, $32, $33, $34, $35, $36,
                COALESCE($37::timestamp with time zone, CURRENT_TIMESTAMP),
                COALESCE($38::timestamp with time zone, CURRENT_TIMESTAMP)
              )
              ON CONFLICT (id) DO NOTHING;
            `, [
              r.id,
              r.candidateId || r.candidate_id || r.id,
              r.name || "Candidate",
              r.email || "",
              r.phone || "",
              r.location || "Remote",
              r.role || "",
              r.jobId || r.targetJobId || r.target_job_id || null,
              r.targetJobTitle || r.target_job_title || null,
              r.field || r.domain || "General",
              r.domain || r.field || "General",
              Number(r.atsScore ?? r.score ?? 0),
              Number(r.atsScore ?? r.score ?? 0),
              Number(r.matchScore ?? r.score ?? 0),
              Number(r.skillsMatchPct ?? 80),
              r.status || "Review",
              JSON.stringify(r.skills || []),
              JSON.stringify(r.allSkills || r.skills || []),
              JSON.stringify(r.secondaryDomains || []),
              JSON.stringify(r.matchedSkills || []),
              JSON.stringify(r.missingSkills || []),
              JSON.stringify(r.missingRequiredSkills || []),
              JSON.stringify(r.missingPreferredSkills || []),
              r.experience || "0 Years",
              Number(r.expYears || 0),
              JSON.stringify(r.experienceEntries || []),
              r.education || "Bachelor's Degree",
              JSON.stringify(r.educationEntries || []),
              r.summary || "",
              JSON.stringify(r.breakdown || {}),
              JSON.stringify(r.aiAnalysis || {}),
              JSON.stringify(r.resumeData || {}),
              JSON.stringify(r.keyPoints || {}),
              r.rawText || r.raw_text || "",
              r.resumeFileName || r.resume_file_name || "",
              r.fileUrl || r.file_url || null,
              r.createdAt || r.created_at || null,
              r.updatedAt || r.updated_at || null
            ]);
          }
        }

        // Pull any manually uploaded PostgreSQL resumes into local storage (ignoring any samples)
        const pgResumes = await client.query(`
          SELECT * FROM public.resumes 
          WHERE id NOT IN ('c-1001', 'c-1002', 'c-1003', 'c-1004', 'c-1005', 'c-1006')
            AND id NOT LIKE 'c-100%'
            AND (email IS NULL OR email NOT LIKE '%@example.com')
          ORDER BY created_at DESC
        `);
        if (pgResumes.rows && pgResumes.rows.length > 0) {
          const mergedResumes = Array.isArray(localResumes) ? [...localResumes] : [];
          for (const row of pgResumes.rows) {
            const existingIdx = mergedResumes.findIndex((x) => x.id === row.id);
            const rObj = {
              id: row.id,
              candidateId: row.candidate_id || row.id,
              name: row.name,
              email: row.email,
              phone: row.phone,
              location: row.location || "Remote",
              role: row.role,
              jobId: row.target_job_id,
              targetJobId: row.target_job_id,
              targetJobTitle: row.target_job_title,
              field: row.field || row.domain || "General",
              domain: row.domain || row.field || "General",
              score: Number(row.ats_score ?? row.score ?? 0),
              atsScore: Number(row.ats_score ?? row.score ?? 0),
              matchScore: Number(row.match_score ?? row.score ?? 0),
              skillsMatchPct: Number(row.skills_match_pct ?? 80),
              status: row.status || "Review",
              skills: Array.isArray(row.skills) ? row.skills : [],
              allSkills: Array.isArray(row.all_skills) ? row.all_skills : (Array.isArray(row.skills) ? row.skills : []),
              secondaryDomains: Array.isArray(row.secondary_domains) ? row.secondary_domains : [],
              matchedSkills: Array.isArray(row.matched_skills) ? row.matched_skills : [],
              missingSkills: Array.isArray(row.missing_skills) ? row.missing_skills : [],
              missingRequiredSkills: Array.isArray(row.missing_required_skills) ? row.missing_required_skills : [],
              missingPreferredSkills: Array.isArray(row.missing_preferred_skills) ? row.missing_preferred_skills : [],
              experience: row.experience || "0 Years",
              expYears: Number(row.exp_years ?? 0),
              experienceEntries: Array.isArray(row.experience_entries) ? row.experience_entries : [],
              education: row.education || "Bachelor's Degree",
              educationEntries: Array.isArray(row.education_entries) ? row.education_entries : [],
              summary: row.summary || "",
              breakdown: typeof row.breakdown === "object" ? row.breakdown : {},
              aiAnalysis: typeof row.ai_analysis === "object" ? row.ai_analysis : {},
              resumeData: typeof row.resume_data === "object" ? row.resume_data : {},
              keyPoints: typeof row.key_points === "object" ? row.key_points : {},
              rawText: row.raw_text || "",
              resumeFileName: row.resume_file_name || "",
              fileUrl: row.file_url || null,
              createdAt: row.created_at || new Date().toISOString(),
              updatedAt: row.updated_at || new Date().toISOString()
            };
            if (existingIdx >= 0) {
              mergedResumes[existingIdx] = { ...mergedResumes[existingIdx], ...rObj };
            } else {
              mergedResumes.push(rObj);
            }
          }
          writeJson(resumesFile, mergedResumes);
        }
      } catch (resumeSyncErr) {
        console.warn("PostgreSQL resume sync notice:", resumeSyncErr.message);
      }

      pgConnected = true;
      console.log("✓ PostgreSQL connected: all databases initialized in PostgreSQL (users, verification_tokens, jobs, candidates, interviews, resumes, email_templates, email_sent, app_settings, candidate_portal_sessions, app_collections).");
    } finally {
      client.release();
    }
  } catch (err) {
    pgConnected = false;
    const reason = err && err.message ? err.message : "No active PostgreSQL server found at " + sqlHost + ":" + sqlPort;
    console.warn("Notice: PostgreSQL live connection currently unavailable (" + reason + "). Dual-layer persistence active (using local storage).");
  }
}

// Immediately attempt non-blocking table verification
initTables().catch((err) => {
  console.warn("Initial PostgreSQL connection attempt:", err.message);
});

// Save or update user
async function saveUser(userData) {
  const { email, fullName, passwordHash, company, website, designation, phone, isVerified } = userData;

  // Always persist to local mirror for full availability
  const usersList = readJson(USERS_FILE);
  const existingIdx = usersList.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
  const now = new Date().toISOString();

  let userRecord;
  if (existingIdx >= 0) {
    userRecord = {
      ...usersList[existingIdx],
      fullName: fullName || usersList[existingIdx].fullName,
      company: company !== undefined ? company : usersList[existingIdx].company,
      website: website !== undefined ? website : usersList[existingIdx].website,
      designation: designation !== undefined ? designation : usersList[existingIdx].designation,
      phone: phone !== undefined ? phone : usersList[existingIdx].phone,
      passwordHash: passwordHash || usersList[existingIdx].passwordHash,
      isVerified: isVerified !== undefined ? Boolean(isVerified) : Boolean(usersList[existingIdx].isVerified),
      updatedAt: now,
    };
    usersList[existingIdx] = userRecord;
  } else {
    userRecord = {
      id: usersList.length + 1,
      email: email.toLowerCase(),
      fullName: fullName || email.split("@")[0],
      passwordHash,
      company: company || "",
      website: website || "",
      designation: designation || "",
      phone: phone || "",
      isVerified: isVerified !== undefined ? Boolean(isVerified) : false,
      createdAt: now,
      updatedAt: now,
    };
    usersList.push(userRecord);
  }
  writeJson(USERS_FILE, usersList);

  // Keep server/data/users.json in sync for unified login compatibility
  try {
    const defaultUsersFile = path.join(DATA_DIR, "users.json");
    const dUsers = readJson(defaultUsersFile);
    const dIdx = dUsers.findIndex((u) => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (dIdx >= 0) {
      dUsers[dIdx] = {
        ...dUsers[dIdx],
        name: fullName || dUsers[dIdx].name,
        company: company !== undefined ? company : dUsers[dIdx].company,
        designation: designation !== undefined ? designation : dUsers[dIdx].designation,
        phone: phone !== undefined ? phone : dUsers[dIdx].phone,
        password_hash: passwordHash || dUsers[dIdx].password_hash,
      };
    } else {
      dUsers.push({
        id: dUsers.length + 1,
        uid: `usr_${Date.now()}`,
        email: email.toLowerCase(),
        name: fullName || email.split("@")[0],
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
        role: "recruiter",
        company: company || "AvaHire Tech Solutions",
        designation: designation || "Talent Recruiter",
        phone: phone || "+91 98000 00000",
        password_hash: passwordHash || null,
        created_at: now,
      });
    }
    writeJson(defaultUsersFile, dUsers);
  } catch (syncErr) {
    console.warn("Could not sync user to users.json:", syncErr.message);
  }

  // Persist to PostgreSQL if available
  try {
    const p = getPool();
    const query = `
      INSERT INTO users (email, full_name, password_hash, company, website, designation, phone, is_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (email) DO UPDATE
      SET full_name = EXCLUDED.full_name,
          password_hash = COALESCE(EXCLUDED.password_hash, public.users.password_hash),
          company = EXCLUDED.company,
          website = EXCLUDED.website,
          designation = EXCLUDED.designation,
          phone = EXCLUDED.phone,
          is_verified = COALESCE(EXCLUDED.is_verified, public.users.is_verified),
          updated_at = CURRENT_TIMESTAMP
      RETURNING id, email, full_name, company, website, designation, phone, is_verified, created_at;
    `;
    const res = await p.query(query, [
      email.toLowerCase(),
      fullName || email.split("@")[0],
      passwordHash || null,
      company || "",
      website || "",
      designation || "",
      phone || "",
      userRecord.isVerified,
    ]);
    if (res.rows && res.rows[0]) {
      return res.rows[0];
    }
  } catch (err) {
    console.warn("PostgreSQL user save fallback:", err.message);
  }

  return userRecord;
}

// Reset password for an account
async function resetPassword(email, newPassword) {
  if (!email || !newPassword) return false;
  const crypto = require("crypto");
  const cleanEmail = email.trim().toLowerCase();
  const passwordHash = crypto.createHash("sha256").update(newPassword).digest("hex");
  const now = new Date().toISOString();

  const usersList = readJson(USERS_FILE);
  const idx = usersList.findIndex((u) => u.email?.toLowerCase() === cleanEmail);
  if (idx >= 0) {
    usersList[idx].passwordHash = passwordHash;
    usersList[idx].isVerified = true;
    usersList[idx].updatedAt = now;
    writeJson(USERS_FILE, usersList);
  } else {
    usersList.push({
      id: usersList.length + 1,
      email: cleanEmail,
      fullName: cleanEmail.split("@")[0],
      passwordHash,
      company: "AvaHire Tech",
      website: "",
      designation: "HR Manager",
      phone: "",
      isVerified: true,
      createdAt: now,
      updatedAt: now,
    });
    writeJson(USERS_FILE, usersList);
  }

  try {
    const p = getPool();
    if (p) {
      await p.query(
        `UPDATE public.users SET password_hash = $1, is_verified = TRUE, updated_at = NOW() WHERE LOWER(email) = $2`,
        [passwordHash, cleanEmail]
      );
    }
  } catch (err) {
    console.warn("PostgreSQL resetPassword fallback:", err.message);
  }
  return true;
}

// Save one-time verification token
async function saveVerificationToken({ email, token, expiresAt }) {
  const now = new Date().toISOString();
  const tokenObj = {
    id: Date.now(),
    email: email.toLowerCase(),
    token,
    expiresAt: expiresAt instanceof Date ? expiresAt.toISOString() : expiresAt,
    used: false,
    usedAt: null,
    createdAt: now,
  };

  // 1. Local mirror
  const tokens = readJson(TOKENS_FILE);
  tokens.push(tokenObj);
  writeJson(TOKENS_FILE, tokens);

  // 2. PostgreSQL
  try {
    const p = getPool();
    const query = `
      INSERT INTO verification_tokens (email, token, expires_at, used, created_at)
      VALUES ($1, $2, $3, FALSE, CURRENT_TIMESTAMP)
      RETURNING id, email, token, expires_at, used, created_at;
    `;
    const res = await p.query(query, [
      email.toLowerCase(),
      token,
      expiresAt instanceof Date ? expiresAt : new Date(expiresAt),
    ]);
    if (res.rows && res.rows[0]) {
      return res.rows[0];
    }
  } catch (err) {
    console.warn("PostgreSQL token save fallback:", err.message);
  }

  return tokenObj;
}

// Find verification token
async function findVerificationToken(token) {
  // 1. Try PostgreSQL first
  try {
    const p = getPool();
    const res = await p.query(
      `SELECT * FROM verification_tokens WHERE token = $1 ORDER BY id DESC LIMIT 1`,
      [token]
    );
    if (res.rows && res.rows.length > 0) {
      const row = res.rows[0];
      return {
        id: row.id,
        email: row.email,
        token: row.token,
        expiresAt: row.expires_at,
        used: row.used,
        usedAt: row.used_at,
        createdAt: row.created_at,
      };
    }
  } catch (err) {
    console.warn("PostgreSQL token lookup fallback:", err.message);
  }

  // 2. Fallback to local mirror
  const tokens = readJson(TOKENS_FILE);
  return tokens.find((t) => t.token === token) || null;
}

// Consume one-time token and verify user
async function consumeVerificationToken(token) {
  const tokenRecord = await findVerificationToken(token);
  if (!tokenRecord) {
    return { success: false, reason: "NOT_FOUND" };
  }

  if (tokenRecord.used) {
    return { success: false, reason: "ALREADY_USED", email: tokenRecord.email };
  }

  const expiry = new Date(tokenRecord.expiresAt);
  if (expiry < new Date()) {
    return { success: false, reason: "EXPIRED", email: tokenRecord.email };
  }

  const now = new Date();

  // Mark token used in PostgreSQL
  try {
    const p = getPool();
    await p.query(
      `UPDATE verification_tokens SET used = TRUE, used_at = $1 WHERE token = $2`,
      [now, token]
    );
    await p.query(
      `UPDATE users SET is_verified = TRUE, updated_at = $1 WHERE email = $2`,
      [now, tokenRecord.email.toLowerCase()]
    );
  } catch (err) {
    console.warn("PostgreSQL consume token fallback:", err.message);
  }

  // Update in local mirror
  const tokens = readJson(TOKENS_FILE);
  const tIdx = tokens.findIndex((t) => t.token === token);
  if (tIdx >= 0) {
    tokens[tIdx].used = true;
    tokens[tIdx].usedAt = now.toISOString();
    writeJson(TOKENS_FILE, tokens);
  }

  const usersList = readJson(USERS_FILE);
  const uIdx = usersList.findIndex((u) => u.email.toLowerCase() === tokenRecord.email.toLowerCase());
  if (uIdx >= 0) {
    usersList[uIdx].isVerified = true;
    usersList[uIdx].updatedAt = now.toISOString();
    writeJson(USERS_FILE, usersList);
  }

  return { success: true, email: tokenRecord.email };
}

// Verify recovery token without consuming yet (for preview/verification)
async function verifyRecoveryToken(token) {
  if (!token) return { valid: false, reason: "MISSING_TOKEN" };
  const cleanToken = token.trim();
  const tokenRecord = await findVerificationToken(cleanToken);
  if (!tokenRecord) {
    return { valid: false, reason: "NOT_FOUND" };
  }
  if (tokenRecord.used) {
    return { valid: false, reason: "ALREADY_USED", email: tokenRecord.email };
  }
  const expiry = new Date(tokenRecord.expiresAt);
  if (expiry < new Date()) {
    return { valid: false, reason: "EXPIRED", email: tokenRecord.email };
  }
  return { valid: true, email: tokenRecord.email };
}

// Securely reset password using a valid recovery token
async function resetPasswordWithToken({ token, newPassword }) {
  if (!token || !newPassword) {
    return { success: false, reason: "MISSING_DATA", error: "Token and new password are required." };
  }

  const cleanToken = token.trim();
  const tokenRecord = await findVerificationToken(cleanToken);
  if (!tokenRecord) {
    return { success: false, reason: "NOT_FOUND", error: "Invalid or nonexistent recovery token." };
  }
  if (tokenRecord.used) {
    return { success: false, reason: "ALREADY_USED", error: "This recovery token has already been used." };
  }
  const expiry = new Date(tokenRecord.expiresAt);
  if (expiry < new Date()) {
    return { success: false, reason: "EXPIRED", error: "This recovery token has expired. Please request a new one." };
  }

  const cleanEmail = tokenRecord.email.toLowerCase().trim();

  // 1. Update the password in database and local mirror
  await resetPassword(cleanEmail, newPassword);

  // 2. Mark token as consumed
  const now = new Date();
  try {
    const p = getPool();
    if (p) {
      await p.query(
        `UPDATE verification_tokens SET used = TRUE, used_at = $1 WHERE token = $2`,
        [now, cleanToken]
      );
    }
  } catch (err) {
    console.warn("PostgreSQL consume recovery token fallback:", err.message);
  }

  const tokens = readJson(TOKENS_FILE);
  const tIdx = tokens.findIndex((t) => t.token === cleanToken);
  if (tIdx >= 0) {
    tokens[tIdx].used = true;
    tokens[tIdx].usedAt = now.toISOString();
    writeJson(TOKENS_FILE, tokens);
  }

  return { success: true, email: cleanEmail };
}

// Get user by email
async function getUserByEmail(email) {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();

  try {
    const p = getPool();
    if (p) {
      const res = await p.query(
        `SELECT id, email, full_name, password_hash, company, website, designation, phone, is_verified, created_at FROM public.users WHERE LOWER(email) = $1 LIMIT 1`,
        [cleanEmail]
      );
      if (res.rows && res.rows[0]) {
        const row = res.rows[0];
        return {
          id: row.id,
          uid: `usr_${row.id}`,
          email: row.email,
          fullName: row.full_name,
          name: row.full_name,
          company: row.company,
          website: row.website,
          designation: row.designation,
          phone: row.phone,
          password_hash: row.password_hash,
          passwordHash: row.password_hash,
          isVerified: row.is_verified,
          createdAt: row.created_at,
        };
      }
    }
  } catch (err) {
    console.warn("PostgreSQL getUserByEmail fallback:", err.message);
  }

  const usersList = readJson(USERS_FILE);
  const found = usersList.find((u) => u.email?.toLowerCase() === cleanEmail);
  if (found) {
    return {
      id: found.id,
      uid: `usr_${found.id}`,
      email: found.email,
      fullName: found.fullName || found.name || "",
      name: found.fullName || found.name || "",
      company: found.company || "",
      website: found.website || "",
      designation: found.designation || "",
      phone: found.phone || "",
      password_hash: found.passwordHash || found.password_hash || null,
      passwordHash: found.passwordHash || found.password_hash || null,
      isVerified: Boolean(found.isVerified),
      createdAt: found.createdAt,
    };
  }

  // Also check default users store
  const defaultUsersFile = path.join(DATA_DIR, "users.json");
  const fallbackUsers = readJson(defaultUsersFile);
  const fallbackFound = fallbackUsers.find((u) => u.email?.toLowerCase() === cleanEmail);
  if (fallbackFound) {
    return {
      id: fallbackFound.id,
      uid: fallbackFound.uid || `usr_${fallbackFound.id}`,
      email: fallbackFound.email,
      fullName: fallbackFound.name,
      name: fallbackFound.name,
      company: fallbackFound.company || "AvaHire",
      website: "",
      designation: fallbackFound.designation || "HR Administrator",
      phone: fallbackFound.phone || "+91 98000 00000",
      password_hash: fallbackFound.password_hash || "password123",
      passwordHash: fallbackFound.password_hash || "password123",
      isVerified: true,
      createdAt: fallbackFound.created_at,
    };
  }

  return null;
}

// Save sent SMTP email to PostgreSQL
async function saveSmtpEmail({
  messageId,
  recipient,
  recipientName,
  senderEmail,
  userEmail,
  subject,
  body,
  html,
  emailType,
  templateId,
  status,
  deliveryMode,
  metadata,
}) {
  const p = getPool();
  if (!p) return null;
  try {
    const res = await p.query(
      `INSERT INTO public.smtp_emails 
        (message_id, recipient, recipient_name, sender_email, user_email, subject, body, html, email_type, template_id, status, delivery_mode, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *;`,
      [
        messageId || null,
        (recipient || "").toLowerCase().trim(),
        recipientName || "",
        senderEmail || "",
        (userEmail || recipient || "").toLowerCase().trim(),
        subject || "No Subject",
        body || "",
        html || null,
        emailType || "general",
        templateId ? String(templateId) : null,
        status || "Delivered",
        deliveryMode || "smtp",
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
    return res.rows[0] || null;
  } catch (err) {
    console.warn("PostgreSQL saveSmtpEmail notice:", err.message);
    return null;
  }
}

// Retrieve stored SMTP emails from PostgreSQL
async function getSmtpEmails({ userEmail, recipient, emailType, limit = 100 }) {
  const p = getPool();
  if (!p) return [];
  try {
    const conditions = [];
    const values = [];

    if (userEmail) {
      values.push(userEmail.toLowerCase().trim());
      conditions.push(`(LOWER(user_email) = $${values.length} OR LOWER(sender_email) = $${values.length} OR LOWER(recipient) = $${values.length})`);
    }

    if (recipient) {
      values.push(recipient.toLowerCase().trim());
      conditions.push(`LOWER(recipient) = $${values.length}`);
    }

    if (emailType && emailType !== "all") {
      values.push(emailType);
      conditions.push(`email_type = $${values.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    values.push(limit);
    const queryStr = `SELECT * FROM public.smtp_emails ${whereClause} ORDER BY created_at DESC LIMIT $${values.length};`;

    const res = await p.query(queryStr, values);
    return res.rows;
  } catch (err) {
    console.warn("PostgreSQL getSmtpEmails notice:", err.message);
    return [];
  }
}

// Generic query runner
async function query(text, params) {
  try {
    const p = getPool();
    if (!p) {
      return { rows: [] };
    }
    return await p.query(text, params);
  } catch (err) {
    console.warn("PostgreSQL query fallback:", err.message);
    return { rows: [] };
  }
}

// Get all registered users for quick account switching
async function getAllUsers() {
  const usersList = readJson(USERS_FILE);
  const defaultUsersFile = path.join(DATA_DIR, "users.json");
  const fallbackUsers = readJson(defaultUsersFile);

  const emailMap = new Map();
  for (const u of fallbackUsers) {
    if (u && u.email) {
      emailMap.set(u.email.toLowerCase(), {
        id: u.id,
        uid: u.uid || `usr_${u.id}`,
        email: u.email.toLowerCase(),
        name: u.name || u.fullName || u.email.split("@")[0],
        fullName: u.name || u.fullName || u.email.split("@")[0],
        avatar: u.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
        company: u.company || "AvaHire",
        designation: u.designation || "HR Administrator",
        role: u.role || "recruiter",
      });
    }
  }

  for (const u of usersList) {
    if (u && u.email) {
      const cEmail = u.email.toLowerCase();
      emailMap.set(cEmail, {
        id: u.id,
        uid: u.uid || `usr_${u.id}`,
        email: cEmail,
        name: u.fullName || u.name || cEmail.split("@")[0],
        fullName: u.fullName || u.name || cEmail.split("@")[0],
        avatar: u.avatar || "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
        company: u.company || "AvaHire",
        designation: u.designation || "HR Administrator",
        role: u.role || "recruiter",
      });
    }
  }

  return Array.from(emailMap.values());
}

function isPgConnected() {
  return pgConnected;
}

function getConnectionStatus() {
  return {
    connected: pgConnected,
    mode: pgConnected ? "PostgreSQL (Live Database)" : "Local JSON Engine (Dual-Layer Persistence Fallback)",
    host: sqlHost,
    port: sqlPort,
    database: sqlDb,
    user: sqlUser,
    hasUrlConfigured: Boolean(process.env.AWS_RDS_URL || process.env.DATABASE_URL)
  };
}

module.exports = {
  getPool,
  initTables,
  isPgConnected,
  getConnectionStatus,
  saveUser,
  resetPassword,
  saveVerificationToken,
  findVerificationToken,
  consumeVerificationToken,
  verifyRecoveryToken,
  resetPasswordWithToken,
  getUserByEmail,
  getAllUsers,
  saveSmtpEmail,
  getSmtpEmails,
  query,
};
