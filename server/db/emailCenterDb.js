const { readData, writeData } = require("./dbEngine");

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
    return newTemplate;
  }

  updateTemplate(id, data) {
    const templates = this.getTemplates();
    const idx = templates.findIndex(t => t.id === Number(id));
    if (idx === -1) return null;
    templates[idx] = { ...templates[idx], ...data, updatedAt: new Date().toISOString() };
    writeData(TEMPLATES_COLLECTION, templates);
    return templates[idx];
  }

  getSentEmails() {
    return readData(SENT_COLLECTION, []);
  }

  sendEmail(emailData) {
    const sentList = this.getSentEmails();
    const newSent = {
      id: `sent-${Date.now()}`,
      recipient: emailData.recipient || emailData.to,
      recipientName: emailData.recipientName || emailData.name || "Candidate",
      subject: emailData.subject || "Update from AvaHire",
      body: emailData.body || "",
      templateId: emailData.templateId || null,
      opened: false,
      openedAt: null,
      sentAt: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }),
      status: "Delivered",
      createdAt: new Date().toISOString()
    };
    sentList.unshift(newSent);
    writeData(SENT_COLLECTION, sentList);

    // If template was used, increment usage counter
    if (emailData.templateId) {
      const templates = this.getTemplates();
      const tIdx = templates.findIndex(t => t.id === Number(emailData.templateId));
      if (tIdx !== -1) {
        templates[tIdx].uses = (templates[tIdx].uses || 0) + 1;
        writeData(TEMPLATES_COLLECTION, templates);
      }
    }

    return newSent;
  }
}

module.exports = new EmailCenterDatabase();
