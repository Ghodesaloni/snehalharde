// Storage helper for interviews and candidate links with backend database synchronization
import { interviewsApi } from "@/services/api";

const STORAGE_KEY = "avahire_interview_sessions";

export const initialInterviews = [];

export const getStoredInterviews = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
                // Filter out any leftover legacy demo records
                const cleaned = parsed.filter(
                    (iv) => !["Snehal Harde", "Rohan Verma", "Aisha Khan", "Rahul Mehta", "Neha Sharma"].includes(iv.name)
                );
                if (cleaned.length !== parsed.length) {
                    saveInterviews(cleaned);
                }
                return cleaned;
            }
        }
    } catch (e) {
        console.error("Error reading stored interviews", e);
    }
    return [];
};

export const getInterviews = getStoredInterviews;

export const saveInterviews = (interviews) => {
    try {
        if (!Array.isArray(interviews)) return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(interviews));
        if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("avahire_interviews_updated"));
        }
    } catch (e) {
        console.error("Error saving interviews", e);
    }
};

export const getInterviewByCodeOrId = (codeOrId) => {
    const list = getStoredInterviews();
    if (!codeOrId) return list[0] || null;
    const match = list.find(
        (iv) =>
            iv.linkCode?.toLowerCase() === codeOrId.toLowerCase() ||
            iv.id?.toLowerCase() === codeOrId.toLowerCase() ||
            iv.candidateId?.toLowerCase() === codeOrId.toLowerCase()
    );
    return match || null;
};

export const addOrUpdateInterview = (interviewData) => {
    const list = getStoredInterviews();
    const existingIndex = list.findIndex(
        (iv) =>
            (interviewData.id && iv.id === interviewData.id) ||
            (interviewData.linkCode && iv.linkCode === interviewData.linkCode) ||
            (interviewData.candidateId && iv.candidateId === interviewData.candidateId)
    );

    let updatedList;
    if (existingIndex >= 0) {
        updatedList = [...list];
        updatedList[existingIndex] = { ...updatedList[existingIndex], ...interviewData };
    } else {
        updatedList = [interviewData, ...list];
    }

    saveInterviews(updatedList);

    // Sync with backend API
    try {
        interviewsApi.create(interviewData).catch(() => {
            // Already created or network fallback
        });
    } catch (err) {
        console.warn("Could not sync interview to backend:", err);
    }

    return interviewData;
};

export const removeInterview = (idOrCode) => {
    if (!idOrCode) return [];
    const list = getStoredInterviews();
    const query = String(idOrCode).toLowerCase();
    const filtered = list.filter(
        (iv) =>
            iv.id !== idOrCode &&
            iv.linkCode !== idOrCode &&
            iv.id?.toLowerCase() !== query &&
            iv.linkCode?.toLowerCase() !== query &&
            iv.candidateId?.toLowerCase() !== query
    );
    saveInterviews(filtered);

    // Sync deletion with backend API
    try {
        interviewsApi.delete(idOrCode).catch(() => {});
    } catch (err) {
        console.warn("Could not delete interview from backend:", err);
    }
    return filtered;
};
