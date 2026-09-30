// Storage helper for interviews and candidate links with backend database synchronization
import { interviewsApi } from "@/services/api";

const BASE_STORAGE_KEY = "avahire_interview_sessions";

const getCurrentUserEmail = () => {
    try {
        const u = JSON.parse(localStorage.getItem("avahire_user") || "{}");
        return (u?.email || localStorage.getItem("avahire_registered_email") || "").toLowerCase().trim();
    } catch {
        return "";
    }
};

const getStorageKey = () => {
    const email = getCurrentUserEmail();
    return email ? `${BASE_STORAGE_KEY}_${email}` : BASE_STORAGE_KEY;
};

export const initialInterviews = [];

export const getStoredInterviews = () => {
    try {
        const key = getStorageKey();
        const currentEmail = getCurrentUserEmail();
        const data = localStorage.getItem(key);
        if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed)) {
                return parsed;
            }
        }

        // Check fallback unpartitioned key only if partitioned was empty, and filter by user
        if (currentEmail) {
            const baseData = localStorage.getItem(BASE_STORAGE_KEY);
            if (baseData) {
                const baseParsed = JSON.parse(baseData);
                if (Array.isArray(baseParsed)) {
                    const filtered = baseParsed.filter(iv => {
                        const author = (iv.createdBy || iv.userEmail || "").toLowerCase().trim();
                        if (currentEmail === "salonighode@gmail.com" || currentEmail === "salonighode3@gmail.com") {
                            return author === "salonighode@gmail.com" || author === "salonighode3@gmail.com";
                        }
                        return author === currentEmail;
                    });
                    if (filtered.length > 0) {
                        saveInterviews(filtered);
                        return filtered;
                    }
                }
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
        const key = getStorageKey();
        localStorage.setItem(key, JSON.stringify(interviews));
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
    const currentEmail = getCurrentUserEmail();
    const dataWithAuthor = {
        ...interviewData,
        createdBy: interviewData.createdBy || currentEmail,
        userEmail: interviewData.userEmail || currentEmail
    };

    const list = getStoredInterviews();
    const existingIndex = list.findIndex(
        (iv) =>
            (dataWithAuthor.id && iv.id === dataWithAuthor.id) ||
            (dataWithAuthor.linkCode && iv.linkCode === dataWithAuthor.linkCode) ||
            (dataWithAuthor.candidateId && iv.candidateId === dataWithAuthor.candidateId)
    );

    let updatedList;
    if (existingIndex >= 0) {
        updatedList = [...list];
        updatedList[existingIndex] = { ...updatedList[existingIndex], ...dataWithAuthor };
    } else {
        updatedList = [dataWithAuthor, ...list];
    }

    saveInterviews(updatedList);

    // Sync with backend API
    try {
        interviewsApi.create(dataWithAuthor).catch(() => {
            // Already created or network fallback
        });
    } catch (err) {
        console.warn("Could not sync interview to backend:", err);
    }

    return dataWithAuthor;
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
