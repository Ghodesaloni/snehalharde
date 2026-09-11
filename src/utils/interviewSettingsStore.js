import { useState, useEffect } from "react";
import { candidatePortalApi } from "@/services/api";

export const SETTINGS_STORAGE_KEY = "avahire_interview_settings";
export const SETTINGS_UPDATE_EVENT = "avahire_interview_settings_updated";

export const DEFAULT_INTERVIEW_SETTINGS = {
  // General Interview Settings
  duration: "30 Minutes",
  joinWindow: "5 Minutes",
  graceTime: "2 Minutes",
  autoEnd: true,
  allowReschedule: false,
  timezone: "(GMT+05:30) Asia/Kolkata",

  // AI Interview Settings
  interviewMode: "AI Interview",
  aiAvatar: "Ava (Female)",
  difficulty: "Medium",
  language: "English",
  askFollowUps: true,
  resumeBasedQuestions: true,
  roleBasedQuestions: true,

  // Proctoring Settings
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

  // Communication & Reminders
  invitationEmail: true,
  reminderBeforeInterview: true,
  reminderTime: "15 Minutes",
  completionEmail: true,

  // Guidelines
  guidelines: [
    "Ensure you are in a quiet place with good internet connection.",
    "Keep your face clearly visible in the camera.",
    "Do not switch tabs or open other applications.",
    "Do not take help from others during the interview.",
    "Be honest and answer confidently.",
    "Interview will be recorded for evaluation purposes."
  ]
};

export const getStoredInterviewSettings = () => {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_INTERVIEW_SETTINGS,
        ...parsed,
        guidelines: Array.isArray(parsed?.guidelines) && parsed.guidelines.length > 0
          ? parsed.guidelines
          : DEFAULT_INTERVIEW_SETTINGS.guidelines
      };
    }
  } catch (err) {
    console.warn("Failed to load interview settings from localStorage:", err);
  }
  return DEFAULT_INTERVIEW_SETTINGS;
};

export const saveStoredInterviewSettings = (newSettings) => {
  try {
    const merged = { ...getStoredInterviewSettings(), ...newSettings };
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent(SETTINGS_UPDATE_EVENT, { detail: merged }));
    return merged;
  } catch (err) {
    console.error("Failed to save interview settings:", err);
    return newSettings;
  }
};

/**
 * Custom React hook to consume live interview settings in candidate portal pages.
 * Seamlessly reacts to changes from HR settings in real-time.
 */
export const useInterviewSettings = (fallbackInitial = null) => {
  const [settings, setSettings] = useState(() => {
    if (fallbackInitial && typeof fallbackInitial === "object") {
      return { ...DEFAULT_INTERVIEW_SETTINGS, ...fallbackInitial };
    }
    return getStoredInterviewSettings();
  });
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // 1. Fetch latest settings from backend API
    candidatePortalApi
      .getInterviewSettings()
      .then((data) => {
        if (isMounted && data) {
          const merged = {
            ...DEFAULT_INTERVIEW_SETTINGS,
            ...data,
            guidelines: Array.isArray(data.guidelines) && data.guidelines.length > 0
              ? data.guidelines
              : DEFAULT_INTERVIEW_SETTINGS.guidelines
          };
          setSettings(merged);
          try {
            localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(merged));
          } catch {
            /* ignore storage write error */
          }
        }
      })
      .catch((err) => {
        console.warn("Candidate portal fallback to cached interview settings:", err);
      })
      .finally(() => {
        if (isMounted) setIsLoaded(true);
      });

    // 2. React to same-window event from Settings page
    const handleSettingsUpdate = (event) => {
      if (event?.detail) {
        setSettings((prev) => ({
          ...prev,
          ...event.detail,
          guidelines: Array.isArray(event.detail.guidelines) && event.detail.guidelines.length > 0
            ? event.detail.guidelines
            : prev.guidelines
        }));
      }
    };

    // 3. React to cross-tab storage changes
    const handleStorageChange = (e) => {
      if (e.key === SETTINGS_STORAGE_KEY && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          setSettings((prev) => ({
            ...prev,
            ...parsed,
            guidelines: Array.isArray(parsed.guidelines) && parsed.guidelines.length > 0
              ? parsed.guidelines
              : prev.guidelines
          }));
        } catch {
          /* ignore parse error */
        }
      }
    };

    window.addEventListener(SETTINGS_UPDATE_EVENT, handleSettingsUpdate);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      isMounted = false;
      window.removeEventListener(SETTINGS_UPDATE_EVENT, handleSettingsUpdate);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return { settings, isLoaded };
};
