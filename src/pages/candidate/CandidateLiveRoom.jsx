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
    Volume2,
    ScrollText,
    FileText,
    Copy,
    Check,
    Search,
    Download,
    X,
    Radio,
    Activity,
    SlidersHorizontal,
    User,
    ArrowDown
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
            name: "Candidate",
            role: "Role Assessment",
            company: "AvaHire Recruiter",
            linkCode: code || ""
        };
    });

    // Call Controls State
    const [isMicOn, setIsMicOn] = useState(true);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [showCaptions, setShowCaptions] = useState(true);
    const [showTranscript, setShowTranscript] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);

    // Transcript Search & Auto-scroll
    const [transcriptSearch, setTranscriptSearch] = useState("");
    const [autoScroll, setAutoScroll] = useState(true);
    const [isCopied, setIsCopied] = useState(false);
    const transcriptBottomRef = useRef(null);

    // Interview Questions & Interactive Flow
    const questions = [
        "Welcome! Could you please introduce yourself and walk us through your most significant technical project?",
        "How do you approach architecting scalable full-stack applications with high concurrency and low latency?",
        "Can you describe a challenging bug or production outage you investigated and how you resolved it?",
        "How do you balance engineering quality, test coverage, and tight product delivery deadlines?"
    ];

    const candidateAnswers = [
        "I have over 4 years of experience as a Senior Full Stack Engineer. Most recently, I architected a distributed data pipeline handling over 40,000 requests per second. We deployed Node.js microservices with Redis clusters and PostgreSQL, reducing latency by 45% and eliminating bottlenecks.",
        "When designing for high concurrency and low latency, I isolate read and write workloads with connection pooling, utilize asynchronous Kafka messaging to decouple heavy compute, and implement multi-layer caching with Redis and CDN edge caching.",
        "During a peak traffic surge, we encountered database connection pool starvation caused by unindexed sequential scans. I diagnosed the query plan using EXPLAIN ANALYZE, added targeted composite indexes, and implemented a resilient circuit breaker pattern with pgBouncer.",
        "I advocate for shift-left testing with automated CI/CD unit and integration test gates. For tight deadlines, I decouple non-blocking enhancements into fast follow-ups while maintaining 100% test coverage on core business logic and financial transactions."
    ];

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [isAITalking, setIsAITalking] = useState(true);
    const [isCandidateAnswering, setIsCandidateAnswering] = useState(false);
    const [interviewEnded, setInterviewEnded] = useState(false);

    // Initial Historic Transcript
    const [transcripts, setTranscripts] = useState([]);

    // Live Streaming Utterance (Speech-to-text in progress)
    const [liveUtterance, setLiveUtterance] = useState({
        speaker: "Ava",
        roleTag: "AI Interviewer",
        time: "00:00:00",
        text: questions[0]
    });

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

    const formatTime = (totalSeconds) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    };

    // Auto-scroll transcript feed when new words or messages arrive
    useEffect(() => {
        if (autoScroll && transcriptBottomRef.current) {
            transcriptBottomRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [transcripts, liveUtterance, autoScroll, showTranscript]);

    // Real-time Speech-to-Text: Browser Web Speech API listener if microphone is active
    useEffect(() => {
        if (typeof window === "undefined") return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;
        if (!isMicOn || interviewEnded || isAITalking) return;

        let recognition = null;
        try {
            recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onresult = (event) => {
                let spokenText = "";
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    spokenText += event.results[i][0].transcript;
                }
                if (spokenText.trim()) {
                    setLiveUtterance({
                        speaker: "Candidate",
                        roleTag: "Candidate (Live Mic)",
                        time: formatTime(elapsedSeconds),
                        text: spokenText.trim()
                    });
                }
            };

            recognition.onerror = () => {
                // Silently ignore permission/sandbox constraints
            };

            recognition.start();
        } catch (e) {
            // SpeechRecognition started or restricted in iframe
        }

        return () => {
            if (recognition) {
                try {
                    recognition.stop();
                } catch (e) {}
            }
        };
    }, [isMicOn, interviewEnded, isAITalking, elapsedSeconds]);

    // Live AI Speech Simulation & Live STT Stream Generation
    useEffect(() => {
        setIsAITalking(true);
        setIsCandidateAnswering(false);

        const currentQuestion = questions[currentQuestionIndex];
        const currentTime = formatTime(elapsedSeconds);

        // Stream Ava's question words
        const words = currentQuestion.split(" ");
        let wordIdx = 0;
        setLiveUtterance({
            speaker: "Ava",
            roleTag: "AI Interviewer",
            time: currentTime,
            text: words[0]
        });

        const wordTimer = setInterval(() => {
            wordIdx++;
            if (wordIdx < words.length) {
                setLiveUtterance((prev) => ({
                    speaker: "Ava",
                    roleTag: "AI Interviewer",
                    time: currentTime,
                    text: words.slice(0, wordIdx + 1).join(" ")
                }));
            } else {
                clearInterval(wordTimer);
            }
        }, 160);

        // When Ava finishes talking, commit question to transcript and trigger candidate response
        const talkingTimer = setTimeout(() => {
            setIsAITalking(false);
            setIsCandidateAnswering(true);

            setTranscripts((prev) => [
                ...prev,
                {
                    id: `stt-q-${currentQuestionIndex}-${Date.now()}`,
                    speaker: "Ava",
                    roleTag: "AI Interviewer",
                    time: currentTime,
                    text: currentQuestion
                }
            ]);

            // Start candidate live speech-to-text response stream
            const answer = candidateAnswers[currentQuestionIndex] || candidateAnswers[0];
            const ansWords = answer.split(" ");
            let ansIdx = 0;
            const ansTime = formatTime(elapsedSeconds + 4);

            setLiveUtterance({
                speaker: "Candidate",
                roleTag: "Candidate",
                time: ansTime,
                text: ansWords[0]
            });

            const candidateStreamInterval = setInterval(() => {
                ansIdx++;
                if (ansIdx < ansWords.length) {
                    setLiveUtterance((prev) => {
                        // If mic is turned off, pause live speech stream
                        if (!isMicOn) return prev;
                        return {
                            speaker: "Candidate",
                            roleTag: "Candidate",
                            time: ansTime,
                            text: ansWords.slice(0, ansIdx + 1).join(" ")
                        };
                    });
                } else {
                    clearInterval(candidateStreamInterval);
                }
            }, 240);

        }, 4000);

        return () => {
            clearInterval(wordTimer);
            clearTimeout(talkingTimer);
        };
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

    // Copy full transcript text
    const handleCopyTranscript = () => {
        const fullText = transcripts
            .map((t) => `[${t.time}] ${t.speaker} (${t.roleTag}):\n${t.text}\n`)
            .join("\n");
        navigator.clipboard.writeText(fullText);
        setIsCopied(true);
        toast.success("Full speech-to-text transcript copied to clipboard!");
        setTimeout(() => setIsCopied(false), 2200);
    };

    // Download transcript file (.txt)
    const handleDownloadTranscript = () => {
        const fullText = `AvaHire Real-Time Interview Transcript\n`
            + `Candidate: ${interviewData.name} | Role: ${interviewData.role}\n`
            + `Session: ${interviewData.linkCode || code} | Date: ${new Date().toLocaleDateString()}\n`
            + `========================================================================\n\n`
            + transcripts.map((t) => `[${t.time}] ${t.speaker.toUpperCase()} (${t.roleTag}):\n${t.text}\n`).join("\n");

        const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `Interview-Transcript-${interviewData.linkCode || "session"}.txt`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Transcript downloaded successfully.");
    };

    // Filtered transcript entries based on search input
    const filteredTranscripts = transcripts.filter((item) => {
        if (!transcriptSearch.trim()) return true;
        const q = transcriptSearch.toLowerCase();
        return (
            item.text.toLowerCase().includes(q) ||
            item.speaker.toLowerCase().includes(q) ||
            item.time.toLowerCase().includes(q)
        );
    });

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

                {/* Right: Security Badge, Transcript Toggle & Leave Room */}
                <div className="flex items-center gap-2.5 sm:gap-4">
                    {/* Header Quick Toggle for Transcript */}
                    <button
                        id="btn-header-transcript-toggle"
                        type="button"
                        onClick={() => {
                            setShowTranscript((prev) => !prev);
                            toast.info(!showTranscript ? "Speech-to-text transcript opened" : "Transcript minimized");
                        }}
                        className={`hidden sm:flex items-center gap-2 text-xs font-bold px-3.5 py-1.5 rounded-xl border backdrop-blur-md transition cursor-pointer ${
                            showTranscript
                                ? "bg-violet-600/40 text-violet-200 border-violet-400/60 shadow-md shadow-violet-500/20"
                                : "bg-black/30 hover:bg-black/50 text-slate-300 border-white/15 hover:border-white/30"
                        }`}
                        title="Toggle Real-Time Speech-to-Text Transcript Feed"
                    >
                        <ScrollText className="w-3.5 h-3.5 text-violet-400" />
                        <span>Live Transcript</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    </button>

                    <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-emerald-400 bg-black/30 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-emerald-500/20">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
                        <span>Secure Connection</span>
                    </div>

                    <span className="hidden sm:inline text-white/20">|</span>

                    <button
                        onClick={() => {
                            let confirmed = true;
                            try {
                                confirmed = window.confirm("Are you sure you want to exit and submit your interview?");
                            } catch (e) {
                                confirmed = true;
                            }
                            if (confirmed) {
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
            <div className={`absolute top-20 left-6 sm:left-10 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 text-xs font-bold text-white shadow-xl pointer-events-none transition-all ${showTranscript ? "opacity-30 sm:opacity-0" : "opacity-100"}`}>
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

            {/* 4. Closed Captions / Subtitle Bar (Only when captions enabled and transcript panel closed or on large screens) */}
            {showCaptions && !showTranscript && (
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

            {/* REAL-TIME SPEECH-TO-TEXT TRANSCRIPT FEED DRAWER / PANEL */}
            {showTranscript && (
                <aside
                    id="realtime-transcript-panel"
                    className="absolute top-20 bottom-28 left-4 sm:left-8 z-40 w-80 sm:w-96 md:w-[440px] max-w-[calc(100vw-2rem)] bg-[#0a0d18]/92 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl shadow-black/95 flex flex-col overflow-hidden animate-in slide-in-from-left-4 fade-in duration-200"
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/[0.03]">
                        <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-violet-600/30 border border-violet-400/40 text-violet-300 flex items-center justify-center shadow-inner">
                                <ScrollText className="w-4 h-4 text-violet-300" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-extrabold text-sm text-white tracking-tight">
                                        Live STT Transcript
                                    </h3>
                                    <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                        Live
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                    <span>Whisper STT Stream</span>
                                    <span>•</span>
                                    {/* Audio wave frequency animation */}
                                    <div className="flex items-center gap-0.5 h-2.5">
                                        <span className="w-0.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                        <span className="w-0.5 h-3 bg-emerald-400 rounded-full animate-pulse delay-75" />
                                        <span className="w-0.5 h-2 bg-emerald-400 rounded-full animate-pulse delay-150" />
                                        <span className="w-0.5 h-1 bg-emerald-400 rounded-full animate-pulse" />
                                    </div>
                                    <span className="text-emerald-400 font-mono">16kHz</span>
                                </div>
                            </div>
                        </div>

                        {/* Top Action Icons */}
                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={handleCopyTranscript}
                                className="p-1.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                                title="Copy Full Transcript"
                            >
                                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>

                            <button
                                onClick={handleDownloadTranscript}
                                className="p-1.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition cursor-pointer"
                                title="Download .TXT Transcript"
                            >
                                <Download className="w-3.5 h-3.5" />
                            </button>

                            <button
                                id="btn-close-transcript"
                                onClick={() => setShowTranscript(false)}
                                className="p-1.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-300 transition cursor-pointer"
                                title="Close Transcript Feed"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Search & Auto-Scroll Bar */}
                    <div className="px-3.5 py-2.5 border-b border-white/10 flex items-center justify-between gap-2 bg-black/20 text-xs">
                        <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={transcriptSearch}
                                onChange={(e) => setTranscriptSearch(e.target.value)}
                                placeholder="Search live transcript..."
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-8 pr-7 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition"
                            />
                            {transcriptSearch && (
                                <button
                                    onClick={() => setTranscriptSearch("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={() => setAutoScroll(!autoScroll)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1 transition cursor-pointer ${
                                autoScroll
                                    ? "bg-violet-600/30 text-violet-300 border-violet-500/40"
                                    : "bg-white/5 text-slate-400 border-white/10 hover:text-slate-200"
                            }`}
                            title="Auto-scroll to latest speech in real-time"
                        >
                            <ArrowDown className="w-3 h-3" />
                            <span>Follow</span>
                        </button>
                    </div>

                    {/* Live Transcript Stream Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20 text-xs select-text">
                        {filteredTranscripts.map((entry) => {
                            const isAva = entry.speaker === "Ava";
                            return (
                                <div
                                    key={entry.id}
                                    className={`p-3 rounded-2xl border transition-all ${
                                        isAva
                                            ? "bg-violet-950/25 border-violet-500/25 text-violet-100 shadow-xs"
                                            : "bg-emerald-950/20 border-emerald-500/25 text-emerald-100 shadow-xs"
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-1.5">
                                            {isAva ? (
                                                <div className="w-5 h-5 rounded-md bg-violet-600 text-white flex items-center justify-center text-[10px] font-black">
                                                    A
                                                </div>
                                            ) : (
                                                <div className="w-5 h-5 rounded-md bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">
                                                    C
                                                </div>
                                            )}
                                            <span className={`font-bold ${isAva ? "text-violet-300" : "text-emerald-300"}`}>
                                                {isAva ? "Ava" : interviewData.name || "Candidate"}
                                            </span>
                                            <span className="text-[10px] text-white/40 font-mono">
                                                ({entry.roleTag})
                                            </span>
                                        </div>
                                        <span className="font-mono text-[10px] text-white/50">
                                            {entry.time}
                                        </span>
                                    </div>
                                    <p className="text-[12px] leading-relaxed text-slate-200 pl-0.5">
                                        {entry.text}
                                    </p>
                                </div>
                            );
                        })}

                        {/* Currently Active Live Utterance (Real-Time STT in progress) */}
                        {liveUtterance && liveUtterance.text && (
                            <div className="p-3 rounded-2xl border border-violet-400/50 bg-violet-600/10 shadow-lg shadow-violet-500/10 animate-pulse">
                                <div className="flex items-center justify-between mb-1.5">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                                        <span className="font-bold text-violet-300">
                                            {liveUtterance.speaker === "Ava" ? "Ava (Speaking)" : `${interviewData.name || "Candidate"} (Speaking)`}
                                        </span>
                                        <span className="text-[10px] text-violet-400/80 font-mono">
                                            [Transcribing Live]
                                        </span>
                                    </div>
                                    <span className="font-mono text-[10px] text-violet-300 font-bold">
                                        {liveUtterance.time}
                                    </span>
                                </div>
                                <p className="text-[12px] leading-relaxed text-white font-medium pl-0.5">
                                    {liveUtterance.text}
                                    <span className="inline-block w-1.5 h-3 bg-violet-400 ml-1 animate-pulse" />
                                </p>
                            </div>
                        )}

                        {filteredTranscripts.length === 0 && !liveUtterance?.text && (
                            <div className="py-12 text-center text-slate-500 space-y-2">
                                <Search className="w-6 h-6 mx-auto opacity-40" />
                                <p className="text-xs">No matching speech detected in transcript.</p>
                            </div>
                        )}

                        <div ref={transcriptBottomRef} />
                    </div>

                    {/* Footer: STT Hardware & Audio Status */}
                    <div className="p-3 border-t border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center gap-1.5">
                            {isMicOn ? (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span className="text-emerald-300 font-semibold">STT Microphone Active</span>
                                </>
                            ) : (
                                <>
                                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                                    <span className="text-rose-300 font-semibold">Microphone Muted</span>
                                </>
                            )}
                        </div>

                        <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                            <span>Confidence: <strong className="text-emerald-400">99.2%</strong></span>
                        </div>
                    </div>
                </aside>
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
                <div className="bg-black/40 backdrop-blur-xl border border-white/15 px-6 sm:px-8 py-2.5 rounded-2xl shadow-2xl flex items-center gap-5 sm:gap-8">
                    
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

                    {/* Real-Time Speech-to-Text Transcript Feed Toggle Button */}
                    <button
                        id="btn-toggle-transcript"
                        type="button"
                        onClick={() => {
                            setShowTranscript((prev) => !prev);
                            toast.info(!showTranscript ? "Speech-to-text transcript opened" : "Transcript feed minimized");
                        }}
                        className="flex flex-col items-center gap-1 group cursor-pointer relative"
                        title="Toggle Real-Time Speech-to-Text Transcript Feed"
                    >
                        <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all relative ${
                                showTranscript
                                    ? "bg-violet-600 text-white border border-violet-400 shadow-lg shadow-violet-500/40 scale-105"
                                    : "bg-white/10 hover:bg-white/20 text-slate-300 border border-white/15"
                            }`}
                        >
                            <ScrollText className="w-5 h-5" />
                            {/* Live pulsing STT indicator badge */}
                            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-black/40"></span>
                            </span>
                        </div>
                        <span
                            className={`text-[11px] font-semibold transition-colors ${
                                showTranscript ? "text-violet-300 font-bold" : "text-slate-300 group-hover:text-white"
                            }`}
                        >
                            Transcript
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
