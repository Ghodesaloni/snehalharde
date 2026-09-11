const { readData, writeData } = require("./dbEngine");

const SETTINGS_COLLECTION = "settings";
const PROFILE_COLLECTION = "profile";

const defaultSettings = {
  companyName: "",
  companyWebsite: "",
  companyLocation: "",
  industry: "",
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
  name: "",
  title: "",
  email: "",
  phone: "",
  avatar: "",
  dept: "",
  bio: "",
  location: "",
  joinedDate: "",
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
