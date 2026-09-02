import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    Mic,
    MicOff,
    Video,
    VideoOff,
    ShieldCheck,
    Sparkles,
    LogOut,
    CheckCircle2,
    Volume2
} from "lucide-react";
import { toast } from "sonner";
import { getInterviewByCodeOrId } from "@/utils/interviewStore";
import AvaHireLogo from "@/components/AvaHireLogo";

const CandidateLiveRoom = () => {
    const { code } = useParams();
    const navigate = useNavigate();

    const [interviewData, setInterviewData] = useState(() => {
        const found = getInterviewByCodeOrId(code);
        if (found) return found;
        return {
            id: "iv-default",
            name: "Sneha Harde",
            role: "Senior Full Stack Engineer",
            company: "AvaHire Technologies Pvt. Ltd.",
            linkCode: code || "akc123"
        };
    });

    // Call Controls State
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [showCaptions, setShowCaptions] = useState(true);
    const [elapsedSeconds, setElapsedSeconds] = useState(504); // Default to around 00:08:24 matching reference

    // Interview Questions & Interactive Flow
    const questions = [
        "Welcome! Could you please introduce yourself and walk us through your most significant technical project?",
        "How do you approach architecting scalable full-stack applications with high concurrency and low latency?",
        "Can you describe a challenging bug or production outage you investigated and how you resolved it?",
        "How do you balance engineering quality, test coverage, and tight product delivery deadlines?"
    ];

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isAITalking, setIsAITalking] = useState(true);
    const [isCandidateAnswering, setIsCandidateAnswering] = useState(false);
    const [interviewEnded, setInterviewEnded] = useState(false);

    const videoRef = useRef(null);
    const [hasCameraStream, setHasCameraStream] = useState(false);

    useEffect(() => {
        const found = getInterviewByCodeOrId(code);
        if (found) {
            setInterviewData(found);
        }
    }, [code]);

    // Live Stopwatch Timer
    useEffect(() => {
        if (interviewEnded) return;
        const interval = setInterval(() => {
            setElapsedSeconds((prev) => prev + 1);
        }, 1000);
        return () => clearInterval(interval);
    }, [interviewEnded]);

    // Live Candidate Camera Stream Setup
    useEffect(() => {
        let activeStream = null;

        const startWebcam = async () => {
            if (isCameraOn && !interviewEnded) {
                try {
                    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                        const stream = await navigator.mediaDevices.getUserMedia({
                            video: {
                                width: { ideal: 1280 },
                                height: { ideal: 720 },
                                facingMode: "user"
                            },
                            audio: false
                        });
                        activeStream = stream;
                        if (videoRef.current) {
                            videoRef.current.srcObject = stream;
                            videoRef.current.onloadedmetadata = () => {
                                videoRef.current.play().catch((e) => console.log("Video play exception:", e));
                            };
                            setHasCameraStream(true);
                        }
                    }
                } catch (err) {
                    console.log("Webcam access info:", err);
                    setHasCameraStream(false);
                }
            } else {
                if (videoRef.current && videoRef.current.srcObject) {
                    videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
                    videoRef.current.srcObject = null;
                }
                setHasCameraStream(false);
            }
        };

        startWebcam();

        return () => {
            if (activeStream) {
                activeStream.getTracks().forEach((track) => track.stop());
            }
        };
    }, [isCameraOn, interviewEnded]);

    // AI Speech Simulation
    useEffect(() => {
        setIsAITalking(true);
        const timer = setTimeout(() => {
            setIsAITalking(false);
            setIsCandidateAnswering(true);
        }, 4000);
        return () => clearTimeout(timer);
    }, [currentQuestionIndex]);

    // Automatic AI Question Progression every 45 seconds if not ended
    useEffect(() => {
        if (interviewEnded) return;
        const timer = setInterval(() => {
            setCurrentQuestionIndex((prev) => {
                if (prev < questions.length - 1) {
                    toast.info(`Ava is moving to Question ${prev + 2} of ${questions.length}`);
                    return prev + 1;
                }
                return prev;
            });
        }, 45000);
        return () => clearInterval(timer);
    }, [interviewEnded, questions.length]);

    const formatTime = (totalSeconds) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    const handleEndInterview = () => {
        setInterviewEnded(true);
        toast.success("Interview completed! Generating AI assessment scorecard.");
    };

    return (
        <div className="fixed inset-0 w-screen h-screen bg-[#06080F] text-white font-sans overflow-hidden select-none">
            
            {/* 1. Full-Screen AI Interviewer (Ava) Video Canvas (100% Device Viewport) */}
            <div className="absolute inset-0 w-full h-full overflow-hidden bg-[#0c101d] z-0">
                <img
                    src="/images/ai_interviewer_ava_feed.jpg"
                    alt="AI Interviewer Ava"
                    className="w-full h-full object-cover object-center filter brightness-[1.03] contrast-[1.03]"
                />

                {/* Subtle Cinematic Vignette Overlays for Maximum Legibility */}
                <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />
                <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />
            </div>

            {/* 2. Transparent Floating Top Bar */}
            <header className="absolute top-0 inset-x-0 px-6 sm:px-10 py-5 flex items-center justify-between z-30 pointer-events-auto">
                
                {/* Left: AvaHire Logo */}
                <div className="flex items-center gap-3">
                    <AvaHireLogo size="sm" variant="darkBg" />
                </div>

                {/* Center: Live Status & Elapsed Stopwatch Timer */}
                <div className="hidden md:flex items-center gap-4 bg-black/40 backdrop-blur-md border border-white/15 px-5 py-2 rounded-2xl shadow-xl text-xs font-semibold text-slate-300">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse shadow-sm shadow-violet-400/50" />
                        <span className="text-white font-bold tracking-wide">Interview in Progress</span>
                    </div>

                    <span className="text-white/20 font-normal">|</span>

                    <span className="font-mono text-white tracking-wider text-sm font-bold">
                        {formatTime(elapsedSeconds)}
                    </span>
                </div>

                {/* Right: Security Badge & Leave Room */}
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-emerald-400 bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-emerald-500/20">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                        <span>Secure Connection</span>
                    </div>

                    <span className="hidden sm:inline text-white/20">|</span>

                    <button
                        onClick={() => {
                            if (window.confirm("Are you sure you want to exit and submit your interview?")) {
                                navigate(`/i/${interviewData.linkCode || code || "akc123"}/thank-you`);
                            }
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 hover:border-red-500/60 bg-red-950/30 hover:bg-red-900/40 backdrop-blur-md text-red-300 text-xs font-bold transition cursor-pointer shadow-lg"
                    >
                        <LogOut className="w-3.5 h-3.5 text-red-400" />
                        <span>Leave Interview</span>
                    </button>
                </div>
            </header>

            {/* 3. Floating Overlay Badges over Full Screen */}
            <div className="absolute top-20 left-6 sm:left-10 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 text-xs font-bold text-white shadow-xl pointer-events-none">
                <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                <span>AI Interviewer: Ava</span>
                {isAITalking && (
                    <span className="flex items-center gap-1 ml-1 text-violet-300 font-mono text-[11px] animate-pulse">
                        <Volume2 className="w-3 h-3 text-violet-400" /> Speaking
                    </span>
                )}
            </div>

            <div className="absolute top-20 right-6 sm:right-10 z-20 text-xs text-slate-300 font-medium bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 shadow-xl pointer-events-none">
                Interview for:{" "}
                <span className="text-violet-400 font-black">
                    {interviewData.role || "Senior Full Stack Engineer"}
                </span>
            </div>

            {/* 4. Closed Captions / Subtitle Bar */}
            {showCaptions && (
                <div className="absolute bottom-28 inset-x-6 sm:inset-x-24 z-20 flex justify-center pointer-events-none animate-in fade-in slide-in-from-bottom-2">
                    <div className="max-w-3xl w-full bg-black/50 backdrop-blur-xl border border-white/15 rounded-2xl px-6 py-3.5 text-center shadow-2xl">
                        <div className="text-[11px] uppercase tracking-wider text-violet-400 font-extrabold mb-0.5">
                            Ava (AI Interviewer) • Question {currentQuestionIndex + 1} of {questions.length}
                        </div>
                        <p className="text-sm sm:text-base font-semibold text-white leading-relaxed">
                            "{questions[currentQuestionIndex]}"
                        </p>
                    </div>
                </div>
            )}

            {/* 5. Bottom Right Floating Candidate Live Camera PiP Window */}
            <div className="absolute bottom-6 right-6 sm:right-10 z-20 w-48 sm:w-60 md:w-72 aspect-[16/10] bg-black/60 backdrop-blur-md rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shadow-black/90 flex items-center justify-center group/pip">
                {/* Live Webcam Stream Video Element */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform -scale-x-100 ${isCameraOn && hasCameraStream ? "block" : "hidden"}`}
                />

                {/* Camera Off / Connecting State */}
                {(!isCameraOn || !hasCameraStream) && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-black/80 text-slate-400 p-4 text-center">
                        <div className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-slate-400">
                            <VideoOff className="w-5 h-5 text-red-400" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-300">
                            {!isCameraOn ? "Camera is Muted" : "Connecting Live Camera..."}
                        </span>
                    </div>
                )}

                {/* Top Right Live Indicator */}
                <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md text-[9px] font-bold text-emerald-400 flex items-center gap-1 border border-white/10">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{isCameraOn && hasCameraStream ? "Live HD" : "Offline"}</span>
                </div>

                {/* Bottom Candidate Label */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
                    <div className="bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-lg text-[10px] font-bold text-white truncate max-w-[140px] shadow-sm border border-white/10">
                        You • {interviewData.name || "Candidate"}
                    </div>
                    <div className="flex items-center gap-1 bg-black/70 backdrop-blur-xs px-1.5 py-0.5 rounded-md border border-white/10">
                        {!isMicOn ? (
                            <div className="w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white" title="Muted">
                                <MicOff className="w-2.5 h-2.5" />
                            </div>
                        ) : (
                            <div className="w-4 h-4 rounded-full bg-emerald-500/30 text-emerald-400 flex items-center justify-center" title="Mic Active">
                                <Mic className="w-2.5 h-2.5" />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 6. Transparent Floating Bottom Call Controls Capsule */}
            <footer className="absolute bottom-6 inset-x-0 z-30 flex justify-center pointer-events-auto bg-transparent">
                <div className="bg-black/40 backdrop-blur-xl border border-white/15 px-8 py-2.5 rounded-2xl shadow-2xl flex items-center gap-7 sm:gap-9">
                    
                    {/* Mic Toggle Button */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsMicOn(!isMicOn);
                            toast.info(isMicOn ? "Microphone muted" : "Microphone active");
                        }}
                        className="flex flex-col items-center gap-1 group cursor-pointer"
                    >
                        <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${isMicOn
                                    ? "bg-white/10 hover:bg-white/20 text-white border border-white/15 shadow-sm"
                                    : "bg-red-500/25 text-red-400 border border-red-500/50"
                                }`}
                        >
                            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white">
                            Mic
                        </span>
                    </button>

                    {/* Camera Toggle Button */}
                    <button
                        type="button"
                        onClick={() => {
                            setIsCameraOn(!isCameraOn);
                            toast.info(isCameraOn ? "Camera feed paused" : "Camera resumed");
                        }}
                        className="flex flex-col items-center gap-1 group cursor-pointer"
                    >
                        <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${isCameraOn
                                    ? "bg-white/10 hover:bg-white/20 text-white border border-white/15 shadow-sm"
                                    : "bg-red-500/25 text-red-400 border border-red-500/50"
                                }`}
                        >
                            {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                        </div>
                        <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white">
                            Camera
                        </span>
                    </button>

                    {/* Closed Captions Button */}
                    <button
                        type="button"
                        onClick={() => {
                            setShowCaptions(!showCaptions);
                            toast.info(showCaptions ? "Captions disabled" : "Captions enabled");
                        }}
                        className="flex flex-col items-center gap-1 group cursor-pointer"
                    >
                        <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${showCaptions
                                    ? "bg-violet-600/40 text-violet-300 border border-violet-400/50 shadow-md shadow-violet-500/20"
                                    : "bg-white/10 hover:bg-white/20 text-slate-400 border border-white/15"
                                }`}
                        >
                            <span className="text-xs font-black tracking-wider">CC</span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-300 group-hover:text-white">
                            Captions
                        </span>
                    </button>

                </div>
            </footer>

            {/* MODAL: INTERVIEW COMPLETED & SCORECARD SUMMARY */}
            {interviewEnded && (
                <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in zoom-in-95">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 text-slate-900 space-y-6 shadow-2xl border border-slate-100 text-center">
                        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
                            <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                                Interview Submitted!
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-500 font-medium">
                                Excellent job, {interviewData.name || "Candidate"}. Your responses have been evaluated by AvaHire AI.
                            </p>
                        </div>

                        {/* AI Evaluation Metrics Card */}
                        <div className="p-4 rounded-2xl bg-[#f8f9ff] border border-slate-100 grid grid-cols-3 gap-2 text-center">
                            <div className="p-2">
                                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Overall Match</div>
                                <div className="text-lg font-black text-violet-600 mt-0.5">94%</div>
                            </div>
                            <div className="p-2 border-x border-slate-200/60">
                                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Tech Depth</div>
                                <div className="text-lg font-black text-emerald-600 mt-0.5">9.2 / 10</div>
                            </div>
                            <div className="p-2">
                                <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Clarity</div>
                                <div className="text-lg font-black text-indigo-600 mt-0.5">9.5 / 10</div>
                            </div>
                        </div>

                        <p className="text-xs text-slate-400 font-medium">
                            A copy of your interview transcript and hiring recommendation has been sent to the recruiter.
                        </p>

                        <div className="pt-2 flex items-center gap-3">
                            <button
                                onClick={() => navigate(`/i/${interviewData.linkCode || code || "akc123"}/thank-you`)}
                                className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-violet-500/25 transition cursor-pointer"
                            >
                                View Final Submission & Receipt →
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default CandidateLiveRoom;
