// Storage helper for interviews and candidate links with backend database synchronization
import { interviewsApi } from "@/services/api";

const STORAGE_KEY = "avahire_interview_sessions";

export const initialInterviews = [
    {
        id: "iv-1",
        candidateId: "c1",
        name: "Snehal Harde",
        email: "snehal@email.com",
        avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
        role: "Frontend Developer",
        company: "AvaHire Technologies Pvt. Ltd.",
        date: "02 September 2026",
        dayOfWeek: "Tuesday",
        time: "11:00 AM",
        timeZone: "IST",
        duration: "45 Minutes",
        durationMins: 45,
        linkCode: "akc123",
        status: "Active",
        expiry: "04:56 Remaining",
        expiryTime: "02 September 2026, 11:56 AM",
        isExpired: false
    },
    {
        id: "iv-2",
        candidateId: "c2",
        name: "Rohan Verma",
        email: "rohanv@email.com",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
        role: "Backend Developer",
        company: "AvaHire Technologies Pvt. Ltd.",
        date: "03 September 2026",
        dayOfWeek: "Wednesday",
        time: "02:00 PM",
        timeZone: "IST",
        duration: "45 Minutes",
        durationMins: 45,
        linkCode: "def456",
        status: "Active",
        expiry: "04:55 Remaining",
        expiryTime: "03 September 2026, 02:55 PM",
        isExpired: false
    },
    {
        id: "iv-3",
        candidateId: "c3",
        name: "Aisha Khan",
        email: "aisha.k@email.com",
        avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=200",
        role: "Full Stack Developer",
        company: "AvaHire Technologies Pvt. Ltd.",
        date: "04 September 2026",
        dayOfWeek: "Thursday",
        time: "10:00 AM",
        timeZone: "IST",
        duration: "60 Minutes",
        durationMins: 60,
        linkCode: "ghi789",
        status: "Scheduled",
        expiry: "Not started",
        expiryTime: "04 September 2026, 11:00 AM",
        isExpired: false
    },
    {
        id: "iv-4",
        candidateId: "c4",
        name: "Rahul Mehta",
        email: "rahul.m@email.com",
        avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
        role: "Python Developer",
        company: "AvaHire Technologies Pvt. Ltd.",
        date: "05 September 2026",
        dayOfWeek: "Friday",
        time: "01:00 PM",
        timeZone: "IST",
        duration: "30 Minutes",
        durationMins: 30,
        linkCode: "jkl012",
        status: "Scheduled",
        expiry: "Not started",
        expiryTime: "05 September 2026, 02:00 PM",
        isExpired: false
    },
    {
        id: "iv-5",
        candidateId: "c5",
        name: "Neha Sharma",
        email: "neha.s@email.com",
        avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
        role: "Data Analyst",
        company: "AvaHire Technologies Pvt. Ltd.",
        date: "01 September 2026",
        dayOfWeek: "Monday",
        time: "03:30 PM",
        timeZone: "IST",
        duration: "45 Minutes",
        durationMins: 45,
        linkCode: "mno345",
        status: "Completed",
        expiry: "Completed",
        expiryTime: "01 September 2026, 04:00 PM",
        isExpired: false
    }
];

export const getStoredInterviews = () => {
    try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
            const parsed = JSON.parse(data);
            if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed;
            }
        }
    } catch (e) {
        console.error("Error reading stored interviews", e);
    }
    // initialize default
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialInterviews));
    return initialInterviews;
};

export const saveInterviews = (interviews) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(interviews));
    } catch (e) {
        console.error("Error saving interviews", e);
    }
};

export const getInterviewByCodeOrId = (codeOrId) => {
    const list = getStoredInterviews();
    if (!codeOrId) return list[0];
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
