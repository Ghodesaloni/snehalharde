// Dynamic Job Description (JD) Relevance & Automatic Shortlisting Engine
// Shortlists resumes strictly based on the Job Description (JD), NOT the ATS score.
// Keeps existing ATS scoring (atsScore, breakdown), backend, database, and resume parsing completely separate and unchanged.

export const CANONICAL_DOMAINS = [
    "Data Science",
    "Software Development",
    "Finance",
    "DevOps",
    "QA / Testing",
    "Data Analytics",
    "UI/UX Design",
    "Human Resources",
    "Mechanical"
];

export const normalizeDomain = (rawDomain = "") => {
    const d = String(rawDomain || "").trim().toLowerCase();
    if (!d || d === "general" || d === "professional") return "";

    if (/data scien|machine learning|\bml\b|deep learning|\bnlp\b|artificial intelligence|\bai\b|data & ai/i.test(d)) {
        return "Data Science";
    }
    if (/devops|cloud|infrastructure|\bsre\b|site reliability/i.test(d)) {
        return "DevOps";
    }
    if (/\bqa\b|quality|testing|test automation/i.test(d)) {
        return "QA / Testing";
    }
    if (/finance|financial|accounting|banking|audit|tax/i.test(d)) {
        return "Finance";
    }
    if (/data analy|business analy|\bbi\b|analytics/i.test(d)) {
        return "Data Analytics";
    }
    if (/ui\/ux|ui\b|ux\b|product design|graphic design|design/i.test(d)) {
        return "UI/UX Design";
    }
    if (/human resources|\bhr\b|recruitment|talent acquisition|people ops/i.test(d)) {
        return "Human Resources";
    }
    if (/mechanical|manufacturing|automotive|thermal|cad/i.test(d)) {
        return "Mechanical";
    }
    if (/software|full\s*stack|frontend|front-end|backend|back-end|web dev|mobile dev|engineering|developer/i.test(d)) {
        return "Software Development";
    }
    return "";
};

const SKILL_SYNONYMS = {
    "python": ["python", "py"],
    "javascript": ["javascript", "js", "ecmascript", "es6"],
    "typescript": ["typescript", "ts"],
    "react": ["react", "reactjs", "react.js"],
    "next.js": ["next.js", "nextjs"],
    "node.js": ["node.js", "nodejs", "node", "express", "express.js"],
    "tailwind css": ["tailwind css", "tailwind", "tailwindcss"],
    "html/css": ["html/css", "html", "html5", "css", "css3"],
    "sql": ["sql", "mysql", "postgresql", "postgres", "sqlite", "pl/sql", "t-sql"],
    "postgresql": ["postgresql", "postgres", "sql"],
    "mongodb": ["mongodb", "mongo", "nosql"],
    "rest apis": ["rest apis", "rest api", "restful", "api", "fastapi", "express", "graphql"],
    "graphql": ["graphql", "apollo"],
    "fastapi": ["fastapi", "flask", "django"],
    "java": ["java", "spring", "spring boot", "j2ee"],
    "git": ["git", "github", "gitlab", "bitbucket", "version control"],
    "system design": ["system design", "microservices", "architecture", "distributed systems", "scalability"],
    "docker": ["docker", "containerization", "containers"],
    "kubernetes": ["kubernetes", "k8s", "helm", "eks", "gke", "aks"],
    "aws": ["aws", "amazon web services", "ec2", "s3", "lambda", "cloud"],
    "terraform": ["terraform", "iac", "infrastructure as code", "cloudformation", "ansible"],
    "ci/cd": ["ci/cd", "cicd", "jenkins", "github actions", "gitlab ci", "continuous integration", "devops"],
    "linux": ["linux", "unix", "bash", "shell scripting", "ubuntu", "centos"],
    "machine learning": ["machine learning", "ml", "supervised learning", "unsupervised learning", "random forest", "logistic regression", "xgboost", "classification", "predictive modeling"],
    "deep learning": ["deep learning", "dl", "neural networks", "artificial neural networks", "ann", "cnn", "rnn", "lstm", "transformers"],
    "natural language processing": ["natural language processing", "nlp", "text mining", "llm", "generative ai", "bert", "gpt"],
    "scikit-learn": ["scikit-learn", "sklearn", "scikit learn", "model evaluation"],
    "tensorflow": ["tensorflow", "pytorch", "keras", "deep learning", "neural networks"],
    "pandas": ["pandas", "data analysis", "eda", "exploratory data analysis"],
    "numpy": ["numpy", "numerical computing"],
    "matplotlib": ["matplotlib", "seaborn", "plotly", "data visualization", "streamlit"],
    "financial modeling": ["financial modeling", "dcf", "discounted cash flow", "forecasting", "quantitative modeling"],
    "financial analysis": ["financial analysis", "variance analysis", "financial statement", "fp&a", "p&l", "balance sheet"],
    "excel": ["excel", "advanced excel", "vba", "macros", "spreadsheets", "pivot tables"],
    "valuation": ["valuation", "dcf", "m&a", "equity research", "capital iq"],
    "accounting": ["accounting", "gaap", "ifrs", "bookkeeping", "auditing", "audit", "taxation", "tally", "quickbooks", "cpa", "cfa"],
    "bloomberg": ["bloomberg", "bloomberg terminal", "capital iq", "factset", "reuters"],
    "selenium": ["selenium", "selenium webdriver", "webdriver"],
    "cypress": ["cypress", "playwright", "puppeteer"],
    "test automation": ["test automation", "automation testing", "automated testing", "qa automation", "testng", "junit", "jest", "pytest"],
    "manual testing": ["manual testing", "test cases", "regression testing", "jira", "bug tracking", "defect tracking", "quality assurance"],
    "figma": ["figma", "sketch", "adobe xd", "wireframing", "prototyping", "ui/ux"],
    "tableau": ["tableau", "data visualization", "dashboards"],
    "power bi": ["power bi", "powerbi", "bi dashboards", "data analysis"]
};

const DEFAULT_DOMAIN_SKILLS = {
    "DevOps": ["AWS", "Kubernetes", "Docker", "Terraform", "CI/CD", "Linux"],
    "Data Science": ["Python", "Machine Learning", "SQL", "Scikit-Learn", "Deep Learning", "Natural Language Processing", "Pandas", "NumPy"],
    "Software Development": ["React", "Node.js", "TypeScript", "JavaScript", "Python", "SQL", "Git"],
    "Finance": ["Financial Modeling", "Financial Analysis", "Excel", "Valuation", "Accounting"],
    "QA / Testing": ["Selenium", "Cypress", "Test Automation", "Manual Testing", "JavaScript", "REST APIs"],
    "Data Analytics": ["SQL", "Python", "Pandas", "Excel", "Tableau", "Power BI"],
    "UI/UX Design": ["Figma", "UI/UX", "Wireframing", "Prototyping", "User Research"],
    "Human Resources": ["Recruitment", "Talent Acquisition", "HR Operations", "Onboarding"],
    "Mechanical": ["AutoCAD", "SolidWorks", "ANSYS", "Thermodynamics", "Mechanical Design"]
};

const CORE_DOMAIN_MARKERS = {
    "Data Science": [
        "machine learning", "deep learning", "natural language processing", "nlp",
        "scikit-learn", "sklearn", "tensorflow", "pytorch", "keras", "pandas",
        "numpy", "neural network", "data science", "matplotlib", "seaborn", "streamlit"
    ],
    "DevOps": [
        "kubernetes", "k8s", "terraform", "ci/cd", "jenkins", "ansible", "helm",
        "linux", "prometheus", "grafana", "devops", "cloudformation"
    ],
    "Software Development": [
        "react", "node.js", "nodejs", "typescript", "javascript", "next.js",
        "tailwind", "express", "fastapi", "graphql", "rest api", "redux",
        "html5", "css3", "postgresql", "mongodb", "spring boot", "full stack", "frontend", "backend"
    ],
    "Finance": [
        "financial modeling", "financial analysis", "valuation", "accounting",
        "bloomberg", "dcf", "audit", "taxation", "cpa", "cfa", "balance sheet"
    ],
    "QA / Testing": [
        "selenium", "cypress", "test automation", "manual testing", "playwright",
        "quality assurance", "regression testing", "appium"
    ],
    "Data Analytics": [
        "tableau", "power bi", "data analytics", "business analytics", "data analysis", "pandas", "sql", "excel"
    ],
    "UI/UX Design": [
        "figma", "wireframing", "prototyping", "user research", "ui/ux", "adobe xd", "sketch"
    ],
    "Human Resources": [
        "talent acquisition", "hr operations", "employee relations", "onboarding", "payroll", "shrm"
    ],
    "Mechanical": [
        "autocad", "solidworks", "catia", "ansys", "thermodynamics", "fluid mechanics", "cnc", "gd&t"
    ]
};

// Detect the professional domain of any Job based on title, skills, department, and description
export const detectJobDomain = (job) => {
    if (!job) return "Software Development";
    const explicit = normalizeDomain(job.domain || job.field);
    if (explicit) return explicit;

    const titleAndSkills = `${job.title || ""} ${(job.keySkills || []).join(" ")}`.toLowerCase();
    const fullText = `${titleAndSkills} ${job.dept || ""} ${job.description || ""}`.toLowerCase();

    // 1. Check job title & keySkills first (highest signal)
    if (/devops|cloud engineer|site reliability|\bsre\b|infrastructure|kubernetes|terraform/i.test(titleAndSkills)) {
        return "DevOps";
    }
    if (/data scien|machine learning|\bml\b|deep learning|\bnlp\b|ai engineer|artificial intelligence/i.test(titleAndSkills)) {
        return "Data Science";
    }
    if (/\bqa\b|quality assurance|test automation|sdet|tester|selenium|cypress/i.test(titleAndSkills)) {
        return "QA / Testing";
    }
    if (/financ|accountant|accounting|valuation|audit|tax|investment|treasury/i.test(titleAndSkills)) {
        return "Finance";
    }
    if (/data analyst|business analyst|bi analyst|analytics|tableau|power\s?bi/i.test(titleAndSkills)) {
        return "Data Analytics";
    }
    if (/ui\/ux|ui designer|ux designer|product designer|graphic designer/i.test(titleAndSkills)) {
        return "UI/UX Design";
    }
    if (/\bhr\b|human resources|recruiter|talent acquisition|people ops/i.test(titleAndSkills)) {
        return "Human Resources";
    }
    if (/mechanical|autocad|solidworks|thermodynamics|manufacturing/i.test(titleAndSkills)) {
        return "Mechanical";
    }
    if (/software|full\s*stack|frontend|front-end|backend|back-end|web developer|react|node\.?js|java developer/i.test(titleAndSkills)) {
        return "Software Development";
    }

    // 2. Fallback to full text (dept + description)
    if (/devops|kubernetes|terraform|ci\/cd|cloud infrastructure/i.test(fullText)) return "DevOps";
    if (/data scien|machine learning|deep learning|tensorflow|pytorch|scikit-learn/i.test(fullText)) return "Data Science";
    if (/\bqa\b|selenium|cypress|test automation|quality engineering/i.test(fullText)) return "QA / Testing";
    if (/financial modeling|discounted cash flow|valuation|accounting|bloomberg/i.test(fullText)) return "Finance";
    if (/data analyst|business analyst|tableau|power\s?bi/i.test(fullText)) return "Data Analytics";
    if (/ui\/ux|wirefram|prototyp|user research/i.test(fullText)) return "UI/UX Design";
    if (/human resources|talent acquisition|recruiter/i.test(fullText)) return "Human Resources";
    if (/mechanical|solidworks|autocad|ansys/i.test(fullText)) return "Mechanical";

    return "Software Development";
};

// Detect the primary professional domain of any Candidate Resume
export const detectCandidateDomain = (candidate) => {
    if (!candidate) return "Software Development";

    const explicitDomain = normalizeDomain(candidate.domain);
    if (explicitDomain) return explicitDomain;

    const explicitField = normalizeDomain(candidate.field);
    if (explicitField) return explicitField;

    const explicitPrimary = normalizeDomain(candidate.domains?.primary);
    if (explicitPrimary) return explicitPrimary;

    const explicitRole = normalizeDomain(candidate.role || candidate.currentRole);
    if (explicitRole) return explicitRole;

    // Infer from skills and rawText
    const skillsText = [
        ...(Array.isArray(candidate.allSkills) ? candidate.allSkills : []),
        ...(Array.isArray(candidate.skills) ? candidate.skills : []),
        candidate.rawText || ""
    ].join(" ").toLowerCase();

    let bestDomain = "Software Development";
    let bestHits = 0;

    for (const [domain, markers] of Object.entries(CORE_DOMAIN_MARKERS)) {
        const hits = markers.filter((m) => skillsText.includes(m)).length;
        if (hits > bestHits) {
            bestHits = hits;
            bestDomain = domain;
        }
    }

    return bestDomain;
};

// Extract all normalized and raw skills from a candidate resume
export const extractCandidateSkillsList = (candidate) => {
    if (!candidate) return [];
    const skillSet = new Set();

    const addSkill = (s) => {
        if (!s || typeof s !== "string") return;
        const cleaned = s.trim();
        if (cleaned) skillSet.add(cleaned);
    };

    (Array.isArray(candidate.allSkills) ? candidate.allSkills : []).forEach(addSkill);
    (Array.isArray(candidate.skills) ? candidate.skills : []).forEach(addSkill);

    if (Array.isArray(candidate.all_normalized_skills)) {
        candidate.all_normalized_skills.forEach((item) => {
            if (item?.normalized) addSkill(item.normalized);
            if (item?.original) addSkill(item.original);
        });
    }

    if (candidate.categorizedSkills && typeof candidate.categorizedSkills === "object") {
        Object.values(candidate.categorizedSkills).forEach((arr) => {
            if (Array.isArray(arr)) arr.forEach(addSkill);
        });
    }

    // Also scan rawText for known technical skills that might not be in top 3 skills array
    const rawTextLower = String(candidate.rawText || candidate.resumeData?.rawText || "").toLowerCase();
    if (rawTextLower) {
        const knownTextSkills = [
            ["Python", /\bpython\b/i],
            ["SQL", /\b(sql|mysql|postgresql|postgres)\b/i],
            ["Machine Learning", /\b(machine learning|supervised|unsupervised)\b/i],
            ["Deep Learning", /\b(deep learning|neural network|artificial neural network)\b/i],
            ["Natural Language Processing", /\b(natural language processing|nlp)\b/i],
            ["Scikit-Learn", /\b(scikit-learn|scikit learn|sklearn)\b/i],
            ["Pandas", /\bpandas\b/i],
            ["NumPy", /\bnumpy\b/i],
            ["Matplotlib", /\b(matplotlib|seaborn)\b/i],
            ["TensorFlow", /\b(tensorflow|pytorch|keras)\b/i],
            ["React", /\b(react|reactjs|react\.js)\b/i],
            ["Node.js", /\b(node\.js|nodejs|express)\b/i],
            ["TypeScript", /\btypescript\b/i],
            ["JavaScript", /\bjavascript\b/i],
            ["Tailwind CSS", /\btailwind\b/i],
            ["HTML/CSS", /\b(html|html5|css|css3)\b/i],
            ["Docker", /\bdocker\b/i],
            ["Kubernetes", /\b(kubernetes|k8s)\b/i],
            ["AWS", /\b(aws|amazon web services)\b/i],
            ["Terraform", /\bterraform\b/i],
            ["CI/CD", /\b(ci\/cd|jenkins|github actions)\b/i],
            ["Linux", /\blinux\b/i],
            ["Git", /\b(git|github)\b/i],
            ["PostgreSQL", /\b(postgresql|postgres)\b/i],
            ["REST APIs", /\b(rest api|restful|fastapi)\b/i],
            ["Java", /\bjava\b/i]
        ];
        for (const [canonical, regex] of knownTextSkills) {
            if (regex.test(rawTextLower)) {
                skillSet.add(canonical);
            }
        }
    }

    return Array.from(skillSet);
};

// Extract the effective JD skills for a job (from keySkills, description, or domain defaults)
export const getEffectiveJobSkills = (job) => {
    if (!job) return [];
    const jobDomain = detectJobDomain(job);
    const explicitSkills = Array.isArray(job.keySkills)
        ? job.keySkills.map((s) => String(s || "").trim()).filter(Boolean)
        : [];

    if (explicitSkills.length > 0) {
        return explicitSkills;
    }

    // Extract skills mentioned in the JD title & description
    const descSkills = [];
    const descText = `${job.title || ""} ${job.description || ""}`.toLowerCase();
    if (descText.trim()) {
        const candidatesToScan = [
            ...(DEFAULT_DOMAIN_SKILLS[jobDomain] || []),
            "Python", "React", "Node.js", "TypeScript", "JavaScript", "SQL", "PostgreSQL",
            "AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux", "Git",
            "Machine Learning", "Deep Learning", "Natural Language Processing", "Scikit-Learn",
            "TensorFlow", "Pandas", "NumPy", "Financial Modeling", "Financial Analysis",
            "Excel", "Valuation", "Accounting", "Bloomberg", "Selenium", "Cypress",
            "Test Automation", "Manual Testing", "REST APIs", "Tailwind CSS", "FastAPI", "GraphQL"
        ];
        for (const sk of candidatesToScan) {
            const lowerSk = sk.toLowerCase();
            const synonyms = SKILL_SYNONYMS[lowerSk] || [lowerSk];
            const found = synonyms.some((syn) => {
                const escaped = syn.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
                const rx = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i");
                return rx.test(descText);
            });
            if (found && !descSkills.some((d) => d.toLowerCase() === lowerSk)) {
                descSkills.push(sk);
            }
        }
    }

    // If description/title yielded fewer than 3 skills, combine with domain defaults for a complete JD profile
    const domainDefaults = DEFAULT_DOMAIN_SKILLS[jobDomain] || DEFAULT_DOMAIN_SKILLS["Software Development"];
    if (descSkills.length >= 3) {
        return descSkills;
    }
    const combined = [...descSkills];
    for (const defSkill of domainDefaults) {
        if (!combined.some((c) => c.toLowerCase() === defSkill.toLowerCase())) {
            combined.push(defSkill);
        }
    }
    return combined;
};

// Check if candidate skills match a specific target JD skill
export const candidateHasSkill = (candidateSkillsLower, candidateRawTextLower, targetSkill) => {
    const targetLower = String(targetSkill || "").trim().toLowerCase();
    if (!targetLower) return false;

    const synonyms = SKILL_SYNONYMS[targetLower] || [targetLower];

    for (const syn of synonyms) {
        if (candidateSkillsLower.some((cs) => cs === syn || cs.includes(syn) || syn.includes(cs))) {
            return true;
        }
        if (candidateRawTextLower) {
            const escaped = syn.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
            const rx = new RegExp(`(?:^|[^a-z0-9+#.])${escaped}(?:$|[^a-z0-9+#.])`, "i");
            if (rx.test(candidateRawTextLower)) {
                return true;
            }
        }
    }
    return false;
};

// Parse minimum required experience years from job.expLevel
const parseJobMinExpYears = (expLevel = "") => {
    const str = String(expLevel || "").trim();
    if (!str || /^0\b|entry|fresher|intern/i.test(str)) return 0;
    const m = str.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
};

// Evaluate a single resume strictly against a specific Job's JD.
// IMPORTANT: Keeps candidate.atsScore completely separate and unchanged!
export const evaluateResumeAgainstJob = (candidate, job) => {
    const preservedAtsScore =
        typeof candidate?.atsScore === "number"
            ? candidate.atsScore
            : Number(candidate?.atsScore) || 0;

    if (!candidate || !job) {
        return {
            isJdMatch: false,
            atsScore: preservedAtsScore,
            jdMatchScore: 0,
            matchScore: candidate?.matchScore || 0,
            skillsMatchPct: candidate?.skillsMatchPct || 0,
            status: "Rejected",
            matchedSkills: [],
            missingSkills: [],
            jobId: job?.id || null,
            targetJobTitle: job?.title || ""
        };
    }

    const candidateDomain = detectCandidateDomain(candidate);
    const jobDomain = detectJobDomain(job);
    const isPrimaryDomainMatch = candidateDomain === jobDomain;
    const isRelatedAnalyticalDomain =
        (candidateDomain === "Data Science" && jobDomain === "Data Analytics") ||
        (candidateDomain === "Data Analytics" && jobDomain === "Data Science");

    const candidateSkills = extractCandidateSkillsList(candidate).filter(
        (s) => s.toLowerCase() !== "recruitment" || jobDomain === "Human Resources"
    );
    const candidateSkillsLower = candidateSkills.map((s) => s.toLowerCase());
    const candidateRawTextLower = String(candidate.rawText || candidate.resumeData?.rawText || "").toLowerCase();

    const jdSkills = getEffectiveJobSkills(job);
    const matchedSkills = [];
    const missingSkills = [];

    for (const reqSkill of jdSkills) {
        if (candidateHasSkill(candidateSkillsLower, candidateRawTextLower, reqSkill)) {
            matchedSkills.push(reqSkill);
        } else {
            missingSkills.push(reqSkill);
        }
    }

    const directMatchedCount = matchedSkills.length;

    // Check domain-specific core markers to verify genuine alignment with the JD's domain
    const domainMarkers = CORE_DOMAIN_MARKERS[jobDomain] || [];
    const matchedDomainMarkers = domainMarkers.filter((marker) =>
        candidateHasSkill(candidateSkillsLower, candidateRawTextLower, marker)
    );

    // Also include extra domain-relevant skills the candidate possesses that align with the JD domain
    const domainDefaultSkills = DEFAULT_DOMAIN_SKILLS[jobDomain] || [];
    for (const domSkill of domainDefaultSkills) {
        if (
            !matchedSkills.some((m) => m.toLowerCase() === domSkill.toLowerCase()) &&
            candidateHasSkill(candidateSkillsLower, candidateRawTextLower, domSkill)
        ) {
            matchedSkills.push(domSkill);
        }
    }

    const totalRequired = Math.max(jdSkills.length, 1);
    const directRatio = directMatchedCount / totalRequired;

    // Determine JD Relevance (isJdMatch) strictly from Job Description alignment (domain + JD skills),
    // completely independent of the candidate's ATS score!
    const minDomainMarkers = ["Finance", "QA / Testing", "UI/UX Design", "Human Resources", "Mechanical", "Data Analytics"].includes(jobDomain)
        ? 1
        : 2;
    const hasCoreDomainCompetency = matchedDomainMarkers.length >= minDomainMarkers;

    let isJdMatch = false;
    if (isPrimaryDomainMatch && hasCoreDomainCompetency) {
        isJdMatch =
            (directMatchedCount >= 2 && directRatio >= 0.2) ||
            directMatchedCount >= 3 ||
            directRatio >= 0.5 ||
            (directMatchedCount >= 1 && matchedDomainMarkers.length >= 3);
    } else if (isRelatedAnalyticalDomain && hasCoreDomainCompetency) {
        isJdMatch = directMatchedCount >= 2 && directRatio >= 0.35;
    } else if (!isPrimaryDomainMatch && hasCoreDomainCompetency) {
        isJdMatch =
            directRatio >= 0.6 &&
            directMatchedCount >= 3 &&
            matchedDomainMarkers.length >= 3;
    }

    // Calculate JD Skill Alignment % and JD Relevance Match % (separate from ATS score)
    const effectiveRatio = Math.min(
        1,
        (directMatchedCount + Math.min(matchedSkills.length - directMatchedCount, 2) * 0.5) / totalRequired
    );
    const skillsMatchPct = Math.round(
        Math.min(100, Math.max(directRatio * 100, effectiveRatio * 100))
    );

    const candExp = Number(candidate.expYears) || 0;
    const jobMinExp = parseJobMinExpYears(job.expLevel);
    const expAlignedBonus = Math.abs(candExp - jobMinExp) <= 1.5 ? 6 : candExp >= jobMinExp ? 4 : 0;

    let jdMatchScore;
    if (isJdMatch) {
        const baseMatch = 75 + Math.round(effectiveRatio * 17) + expAlignedBonus;
        jdMatchScore = Math.min(98, Math.max(76, baseMatch));
    } else {
        const lowMatch = Math.round(directRatio * 40) + (isPrimaryDomainMatch ? 10 : 0);
        jdMatchScore = Math.min(49, Math.max(12, lowMatch));
    }

    // Shortlisting status is determined strictly by JD relevance (isJdMatch), NOT ATS score
    const status = isJdMatch ? "Shortlisted" : "Rejected";

    const strengths =
        matchedSkills.length > 0
            ? [
                  `Matches required JD skills for ${job.title}: ${matchedSkills.slice(0, 6).join(", ")}.`,
                  `Strong ${jobDomain} Job Description alignment with ${candidateSkills.length} relevant competencies.`
              ]
            : [`Evaluated against ${job.title} (${jobDomain}) Job Description.`];

    const verdict = isJdMatch
        ? `Shortlisted for ${job.title} strictly based on Job Description (JD) relevance (${jdMatchScore}% JD Match). Matches key JD skills: ${matchedSkills.slice(0, 5).join(", ")}. (ATS Score ${preservedAtsScore}/100 kept separate)`
        : `Not shortlisted for ${job.title} based on Job Description (JD) relevance (${jdMatchScore}% JD Match). Profile (${candidateDomain}) does not match ${jobDomain} JD requirements.`;

    const summary = isJdMatch
        ? `${candidate.name} is shortlisted strictly based on relevance to the ${job.title} Job Description (${jobDomain}), matching key JD skills: ${matchedSkills.slice(0, 5).join(", ")}.`
        : `${candidate.name}'s resume (${candidateDomain}) is not relevant to the ${job.title} (${jobDomain}) Job Description.`;

    return {
        isJdMatch,
        atsScore: preservedAtsScore, // Unchanged & separate ATS score
        jdMatchScore,
        matchScore: jdMatchScore,
        skillsMatchPct,
        status,
        matchedSkills,
        missingSkills,
        missingRequiredSkills: missingSkills,
        jobId: job.id,
        targetJobId: job.id,
        targetJobTitle: job.title,
        jobDomain,
        candidateDomain,
        cleanSkills: candidateSkills,
        keyPoints: {
            strengths,
            missingSkills: missingSkills.slice(0, 6),
            experienceMatch: `Candidate has ${candidate.experience || `${candExp} Years`} experience (Role level: ${job.expLevel || "Open"}).`,
            verdict
        },
        summary
    };
};

// Find the best matching job JD for a candidate across all available jobs
export const findBestMatchingJobForCandidate = (candidate, jobs = []) => {
    if (!candidate || !Array.isArray(jobs) || jobs.length === 0) return null;

    let bestEval = null;
    let bestJob = null;

    // First check if the candidate's assigned jobId is a valid JD match
    if (candidate.jobId || candidate.targetJobId) {
        const assignedJob = jobs.find(
            (j) => j && (j.id === candidate.jobId || j.id === candidate.targetJobId)
        );
        if (assignedJob) {
            const assignedEval = evaluateResumeAgainstJob(candidate, assignedJob);
            if (assignedEval.isJdMatch) {
                bestEval = assignedEval;
                bestJob = assignedJob;
            }
        }
    }

    // Evaluate across all jobs to find the strongest genuine JD match (by jdMatchScore, NOT atsScore)
    for (const job of jobs) {
        if (!job) continue;
        const ev = evaluateResumeAgainstJob(candidate, job);
        if (ev.isJdMatch) {
            if (!bestEval || ev.jdMatchScore > bestEval.jdMatchScore) {
                bestEval = ev;
                bestJob = job;
            }
        }
    }

    if (bestJob && bestEval) {
        return { job: bestJob, evaluation: bestEval };
    }

    return null;
};

// Return a candidate object enriched with JD evaluation for a target job (or their best matching job JD)
// while keeping candidate.atsScore and candidate.breakdown completely separate and unchanged.
export const enrichCandidateForJob = (candidate, targetJob = null, allJobs = []) => {
    if (!candidate) return candidate;

    const preservedAtsScore =
        typeof candidate.atsScore === "number"
            ? candidate.atsScore
            : Number(candidate.atsScore) || 0;

    const cleanSkills = extractCandidateSkillsList(candidate).filter(
        (s) => s.toLowerCase() !== "recruitment" || detectCandidateDomain(candidate) === "Human Resources"
    );

    if (targetJob && targetJob.id) {
        const ev = evaluateResumeAgainstJob(candidate, targetJob);
        return {
            ...candidate,
            atsScore: preservedAtsScore, // Keep ATS score separate and unchanged
            domain: ev.candidateDomain,
            field: ev.candidateDomain,
            skills: cleanSkills.slice(0, 4),
            allSkills: cleanSkills,
            matchScore: ev.jdMatchScore,
            skillsMatchPct: ev.skillsMatchPct,
            status: candidate.manualStatusOverride || ev.status,
            matchedSkills: ev.matchedSkills,
            missingSkills: ev.missingSkills,
            missingRequiredSkills: ev.missingRequiredSkills,
            keyPoints: ev.keyPoints,
            summary: ev.summary,
            matchedJobId: ev.isJdMatch ? targetJob.id : null,
            matchedJobTitle: ev.isJdMatch ? targetJob.title : null,
            isJdMatch: ev.isJdMatch
        };
    }

    const bestMatch = findBestMatchingJobForCandidate(candidate, allJobs);
    if (bestMatch) {
        const { job, evaluation: ev } = bestMatch;
        return {
            ...candidate,
            atsScore: preservedAtsScore, // Keep ATS score separate and unchanged
            domain: ev.candidateDomain,
            field: ev.candidateDomain,
            skills: cleanSkills.slice(0, 4),
            allSkills: cleanSkills,
            matchScore: ev.jdMatchScore,
            skillsMatchPct: ev.skillsMatchPct,
            status: candidate.manualStatusOverride || "Shortlisted",
            matchedSkills: ev.matchedSkills,
            missingSkills: ev.missingSkills,
            missingRequiredSkills: ev.missingRequiredSkills,
            keyPoints: ev.keyPoints,
            summary: ev.summary,
            jobId: job.id,
            targetJobId: job.id,
            targetJobTitle: job.title,
            matchedJobId: job.id,
            matchedJobTitle: job.title,
            isJdMatch: true
        };
    }

    const candidateDomain = detectCandidateDomain(candidate);
    return {
        ...candidate,
        atsScore: preservedAtsScore, // Keep ATS score separate and unchanged
        domain: candidateDomain,
        field: candidateDomain,
        skills: cleanSkills.slice(0, 4),
        allSkills: cleanSkills,
        status: candidate.manualStatusOverride || "Rejected",
        matchedJobId: null,
        matchedJobTitle: null,
        isJdMatch: false
    };
};

// Get ONLY the resumes that are relevant to a specific Job's JD (shortlisted strictly by JD, not ATS score)
export const getMatchingResumesForJob = (resumes = [], job = null, allJobs = []) => {
    if (!job || !Array.isArray(resumes)) return [];
    return resumes
        .map((r) => enrichCandidateForJob(r, job, allJobs))
        .filter((r) => r && r.isJdMatch)
        .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
};
