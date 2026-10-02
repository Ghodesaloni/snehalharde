const { readData, writeData } = require("./dbEngine");
const postgresDb = require("./postgres");

const TEMPLATES_COLLECTION = "email_templates";
const SENT_COLLECTION = "email_sent";

const defaultTemplates = [
  {
    id: 1,
    name: "Interview Invitation",
    subject: "You're invited to interview for {{role}} at {{company}}",
    body: "Hi {{candidateName}},\n\nWe were very impressed by your background and would like to invite you for an AI-powered technical interview for the {{role}} position.\n\nPlease join using your personalized link:\n{{interviewLink}}\n\nBest regards,\nTalent Acquisition Team\n{{company}}",
    uses: 0,
    category: "Interview",
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    name: "Shortlist Confirmation",
    subject: "Great news! You've been shortlisted for {{role}}",
    body: "Dear {{candidateName}},\n\nCongratulations! Your profile has been shortlisted for the next stage of our recruitment process for {{role}}.\n\nOur team will be in touch shortly with next steps.\n\nWarm regards,\n{{company}}",
    uses: 0,
    category: "Status",
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    name: "Rejection Email",
    subject: "Update on your application for {{role}}",
    body: "Dear {{candidateName}},\n\nThank you for taking the time to speak with us. While your qualifications are impressive, we have decided to move forward with other candidates whose skills more closely align with our current needs.\n\nWe wish you the very best in your job search.\n\nSincerely,\n{{company}}",
    uses: 0,
    category: "Status",
    createdAt: new Date().toISOString()
  },
  {
    id: 4,
    name: "Offer Letter",
    subject: "Official Offer Letter - {{role}} at {{company}}",
    body: "Dear {{candidateName}},\n\nOn behalf of {{company}}, we are thrilled to offer you the position of {{role}}! We were deeply impressed by your interviews and believe you will make a tremendous impact.\n\nPlease find attached the official offer details.\n\nWelcome aboard,\n{{company}}",
    uses: 0,
    category: "Offer",
    createdAt: new Date().toISOString()
  }
];

class EmailCenterDatabase {
  async getTemplatesAsync() {
    try {
      const pool = postgresDb.getPool();
      const res = await pool.query("SELECT * FROM public.email_templates ORDER BY id ASC");
      if (res.rows && res.rows.length > 0) {
        return res.rows.map(r => ({
          id: r.id,
          name: r.name,
          subject: r.subject,
          body: r.body,
          category: r.category || "General",
          uses: Number(r.uses || 0),
          createdAt: r.created_at,
          updatedAt: r.updated_at
        }));
      }
    } catch (e) {}
    return this.getTemplates();
  }

  getTemplates() {
    return readData(TEMPLATES_COLLECTION, defaultTemplates);
  }

  getTemplateById(id) {
    const templates = this.getTemplates();
    return templates.find(t => t.id === Number(id)) || null;
  }

  createTemplate(data) {
    const templates = this.getTemplates();
    const newTemplate = {
      id: Date.now(),
      name: data.name || "Custom Template",
      subject: data.subject || "No Subject",
      body: data.body || "",
      category: data.category || "General",
      uses: 0,
      createdAt: new Date().toISOString()
    };
    templates.push(newTemplate);
    writeData(TEMPLATES_COLLECTION, templates);

    try {
      const pool = postgresDb.getPool();
      pool.query(`
        INSERT INTO public.email_templates (id, name, subject, body, category, uses, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          subject = EXCLUDED.subject,
          body = EXCLUDED.body,
          updated_at = NOW();
      `, [newTemplate.id, newTemplate.name, newTemplate.subject, newTemplate.body, newTemplate.category, 0]).catch(() => {});
    } catch (e) {}

    return newTemplate;
  }

  updateTemplate(id, data) {
    const templates = this.getTemplates();
    const idx = templates.findIndex(t => t.id === Number(id));
    if (idx === -1) return null;
    templates[idx] = { ...templates[idx], ...data, updatedAt: new Date().toISOString() };
    writeData(TEMPLATES_COLLECTION, templates);

    try {
      const pool = postgresDb.getPool();
      pool.query(`
        UPDATE public.email_templates SET
          name = COALESCE($2, name),
          subject = COALESCE($3, subject),
          body = COALESCE($4, body),
          category = COALESCE($5, category),
          updated_at = NOW()
        WHERE id = $1
      `, [id, data.name || null, data.subject || null, data.body || null, data.category || null]).catch(() => {});
    } catch (e) {}

    return templates[idx];
  }

  getSentEmails(_filters = {}) {
    // Sent emails are strictly private and not returned or displayed in Email Center
    return [];
  }

  storeSmtpEmail(emailData) {
    // Increment template usage counter if a template was used
    if (emailData.templateId) {
      const templates = this.getTemplates();
      const tIdx = templates.findIndex(t => t.id === Number(emailData.templateId));
      if (tIdx !== -1) {
        templates[tIdx].uses = (templates[tIdx].uses || 0) + 1;
        writeData(TEMPLATES_COLLECTION, templates);
      }
    }

    const emailId = emailData.id || `smtp-${Date.now()}`;

    // Persist to PostgreSQL public.email_sent
    try {
      const pool = postgresDb.getPool();
      pool.query(`
        INSERT INTO public.email_sent (
          id, recipient, recipient_name, sender_email, user_email, created_by,
          subject, body, html, type, template_id, status, delivery_mode, sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
        ON CONFLICT (id) DO NOTHING
      `, [
        emailId,
        emailData.recipient || emailData.to || "recipient@example.com",
        emailData.candidateName || emailData.recipientName || null,
        emailData.from || "salonighode@gmail.com",
        emailData.userEmail || null,
        emailData.createdBy || null,
        emailData.subject || "Email Notification",
        emailData.body || "",
        emailData.html || null,
        emailData.type || "Interview",
        emailData.templateId ? String(emailData.templateId) : null,
        "Delivered",
        emailData.deliveryMode || "smtp"
      ]).catch(e => console.warn("PostgreSQL email_sent log notice:", e.message));
    } catch (e) {}

    return {
      id: emailId,
      recipient: emailData.recipient,
      subject: emailData.subject,
      status: "Dispatched",
      sentAt: "Just now"
    };
  }

  sendEmail(emailData) {
    return this.storeSmtpEmail({
      ...emailData,
      type: emailData.type || "Candidate Communication",
      deliveryMode: "smtp"
    });
  }
}

module.exports = new EmailCenterDatabase();
