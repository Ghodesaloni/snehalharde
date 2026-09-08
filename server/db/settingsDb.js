const { readData, writeData } = require("./dbEngine");

const SETTINGS_COLLECTION = "settings";
const PROFILE_COLLECTION = "profile";

const defaultSettings = {
  companyName: "AvaHire Technologies Pvt. Ltd.",
  companyWebsite: "https://avahire.ai",
  companyLocation: "Bangalore, India",
  industry: "Information Technology & Services",
  aiStrictness: "Moderate",
  defaultInterviewDuration: 45,
  minShortlistAtsScore: 80,
  autoSendInviteOnShortlist: true,
  emailNotifications: {
    candidateApplied: true,
    interviewCompleted: true,
    weeklyReport: true
  },
  aiAvatar: "Ava (Technical Evaluator)",
  timeZone: "Asia/Kolkata (IST)",
  updatedAt: new Date().toISOString()
};

const defaultProfile = {
  name: "Snehal Harde",
  title: "Lead Technical Recruiter",
  email: "snehal.harde@avahire.ai",
  phone: "+91 98765 43210",
  avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
  dept: "Talent Acquisition & HR",
  bio: "Experienced Technical Recruiter specializing in hiring frontend, backend, AI/ML and Cloud engineering talent.",
  location: "Nagpur / Bangalore, India",
  joinedDate: "January 2024",
  updatedAt: new Date().toISOString()
};

class SettingsDatabase {
  getSettings() {
    return readData(SETTINGS_COLLECTION, defaultSettings);
  }

  updateSettings(updates) {
    const current = this.getSettings();
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    writeData(SETTINGS_COLLECTION, updated);
    return updated;
  }

  getProfile() {
    return readData(PROFILE_COLLECTION, defaultProfile);
  }

  updateProfile(updates) {
    const current = this.getProfile();
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    writeData(PROFILE_COLLECTION, updated);
    return updated;
  }
}

module.exports = new SettingsDatabase();
