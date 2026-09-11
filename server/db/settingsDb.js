const { readData, writeData } = require("./dbEngine");

const SETTINGS_COLLECTION = "settings";
const PROFILE_COLLECTION = "profile";
const INTERVIEW_SETTINGS_COLLECTION = "interview_settings";

const defaultInterviewSettings = {
  duration: "30 Minutes",
  joinWindow: "5 Minutes",
  graceTime: "2 Minutes",
  autoEnd: true,
  allowReschedule: false,
  timezone: "(GMT+05:30) Asia/Kolkata",

  interviewMode: "AI Interview",
  aiAvatar: "Ava (Female)",
  difficulty: "Medium",
  language: "English",
  askFollowUps: true,
  resumeBasedQuestions: true,
  roleBasedQuestions: true,

  enableProctoring: true,
  faceDetection: true,
  multiplePersonDetection: true,
  tabSwitchDetection: true,
  fullScreenMonitoring: true,
  suspiciousThreshold: "3 Actions",
  suspiciousToggle: false,
  screenRecording: false,
  videoRecording: true,
  audioRecording: true,

  invitationEmail: true,
  reminderBeforeInterview: true,
  reminderTime: "15 Minutes",
  completionEmail: true,

  guidelines: [
    "Ensure you are in a quiet place with good internet connection.",
    "Keep your face clearly visible in the camera.",
    "Do not switch tabs or open other applications.",
    "Do not take help from others during the interview.",
    "Be honest and answer confidently.",
    "Interview will be recorded for evaluation purposes."
  ],
  updatedAt: new Date().toISOString()
};

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
    const orgSettings = readData(SETTINGS_COLLECTION, defaultSettings);
    const interviewSettings = this.getInterviewSettings();
    return {
      ...orgSettings,
      interviewSettings
    };
  }

  updateSettings(updates) {
    const current = readData(SETTINGS_COLLECTION, defaultSettings);
    if (updates.interviewSettings) {
      this.updateInterviewSettings(updates.interviewSettings);
    }
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    writeData(SETTINGS_COLLECTION, updated);
    return this.getSettings();
  }

  getInterviewSettings() {
    return readData(INTERVIEW_SETTINGS_COLLECTION, defaultInterviewSettings);
  }

  updateInterviewSettings(updates) {
    const current = readData(INTERVIEW_SETTINGS_COLLECTION, defaultInterviewSettings);
    const updated = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    writeData(INTERVIEW_SETTINGS_COLLECTION, updated);
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
