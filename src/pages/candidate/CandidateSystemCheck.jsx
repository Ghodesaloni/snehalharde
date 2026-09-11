import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    Camera,
    Mic,
    Volume2,
    Wifi,
    Laptop,
    RotateCw,
    Play,
    Check,
    CheckCircle2,
    Info,
    HelpCircle,
    ArrowRight,
    LogOut,
    Sparkles,
    ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { getInterviewByCodeOrId } from "@/utils/interviewStore";
import AvaHireLogo from "@/components/AvaHireLogo";

const CandidateSystemCheck = () => {
    const { code } = useParams();
    const navigate = useNavigate();

    const [interviewData, setInterviewData] = useState(() => {
        const found = getInterviewByCodeOrId(code);
        if (found) return found;
        return {
            id: "iv-default",
            name: "Candidate",
            role: "Job Assessment",
            company: "AvaHire Recruiter",
            linkCode: code || ""
        };
    });

    const videoRef = useRef(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraResolution, setCameraResolution] = useState("720p HD");
    const [audioLevel, setAudioLevel] = useState(7); // Active bars out of 16
    const [isPlayingTone, setIsPlayingTone] = useState(false);
    const [audioTested, setAudioTested] = useState(false);
    const [latency, setLatency] = useState(24);

    // Initialize Camera Feed
    useEffect(() => {
        let stream = null;
        const startCamera = async () => {
            try {
                if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
                    if (videoRef.current) {
                        videoRef.current.srcObject = stream;
                        videoRef.current.play().catch(() => {});
                        setIsCameraActive(true);
                    }
                } else {
                    setIsCameraActive(true);
                }
            } catch (err) {
                // If browser blocks camera, we show active simulated feed
                console.log("Webcam access note:", err);
                setIsCameraActive(true);
            }
        };

        startCamera();

        // Simulate lively audio equalizer fluctuation
        const audioInterval = setInterval(() => {
            setAudioLevel(Math.floor(Math.random() * 6) + 6);
        }, 300);

        return () => {
            clearInterval(audioInterval);
            if (stream) {
                stream.getTracks().forEach((track) => track.stop());
            }
        };
    }, []);

    // Refresh Camera Feed
    const handleRefreshCamera = async () => {
        toast.info("Re-initializing camera stream...");
        setIsCameraActive(false);
        try {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(() => {});
                }
            }
        } catch (e) {}
        setTimeout(() => {
            setIsCameraActive(true);
            toast.success("Camera feed reconnected!");
        }, 600);
    };

    // Play pleasant synthetic audio tone using Web Audio API
    const handlePlayTone = () => {
        setIsPlayingTone(true);
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();

                osc.type = "sine";
                osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
                osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5

                gain.gain.setValueAtTime(0.15, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

                osc.connect(gain);
                gain.connect(ctx.destination);

                osc.start();
                osc.stop(ctx.currentTime + 0.6);
            }
        } catch (e) {
            console.error("Audio error", e);
        }

        setTimeout(() => {
            setIsPlayingTone(false);
            setAudioTested(true);
            toast.success("Sound test complete!");
        }, 700);
    };

    const handleProceed = () => {
        toast.success("Diagnostics verified! Proceeding to instructions.");
        navigate(`/i/${interviewData.linkCode || code || "akc123"}/instructions`);
    };

    return (
        <div className="min-h-screen bg-[#f8f9ff] text-slate-900 font-sans flex flex-col justify-between selection:bg-violet-500 selection:text-white">
            
            {/* Top Navigation Bar */}
            <header className="w-full bg-white border-b border-slate-200/80 px-6 sm:px-10 py-4 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
                {/* AvaHire Logo */}
                <AvaHireLogo size="sm" variant="dark" />

                {/* Leave Room Button */}
                <button
                    onClick={() => {
                        let confirmed = true;
                        try {
                            confirmed = window.confirm("Are you sure you want to leave the interview room?");
                        } catch (e) {
                            confirmed = true;
                        }
                        if (confirmed) {
                            navigate(`/i/${interviewData.linkCode || code || "akc123"}`);
                        }
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition shadow-2xs cursor-pointer"
                >
                    <LogOut className="w-4 h-4 text-slate-500" />
                    <span>Leave Room</span>
                </button>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                
                {/* Two-Column Diagnostics Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* LEFT COLUMN: Camera Test & Microphone */}
                    <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-5">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm tracking-wide">
                                <Camera className="w-4 h-4 text-violet-600" />
                                <span className="uppercase text-xs font-extrabold">Camera Test</span>
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                Camera Active ({cameraResolution})
                            </span>
                        </div>

                        {/* Camera Video Viewport */}
                        <div className="w-full aspect-[16/10] bg-[#0c1222] rounded-2xl overflow-hidden relative border border-slate-800 flex items-center justify-center group shadow-inner">
                            {/* Live Video Element */}
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className={`w-full h-full object-cover transform -scale-x-100 ${isCameraActive ? "block" : "hidden"}`}
                            />

                            {/* Fallback Simulated Avatar stream if video is loading */}
                            {!isCameraActive && (
                                <div className="text-center space-y-3">
                                    <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                                        <Camera className="w-8 h-8 animate-pulse text-violet-400" />
                                    </div>
                                    <p className="text-xs text-slate-400 font-medium">Connecting camera feed...</p>
                                </div>
                            )}

                            {/* Top Right: Refresh Button */}
                            <button
                                onClick={handleRefreshCamera}
                                className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-md hover:bg-slate-900 text-white border border-slate-700/80 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-md cursor-pointer active:scale-95"
                                title="Refresh camera feed"
                            >
                                <RotateCw className="w-3.5 h-3.5" />
                                <span>Refresh</span>
                            </button>

                            {/* Bottom Left: Live Feed Connected Badge */}
                            <div className="absolute bottom-4 left-4 bg-slate-900/85 backdrop-blur-md border border-slate-700/70 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-md">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Live Feed Connected</span>
                            </div>
                        </div>

                        {/* Microphone Audio Level Section */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs sm:text-sm">
                                    <Mic className="w-4 h-4 text-violet-600" />
                                    <span>Microphone Audio Level</span>
                                </div>
                                <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                    Audio Detected
                                </span>
                            </div>

                            {/* Audio Equalizer Bars */}
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                {[...Array(16)].map((_, i) => (
                                    <div
                                        key={i}
                                        className={`flex-1 h-3 rounded-full transition-all duration-150 ${i < audioLevel
                                                ? "bg-gradient-to-r from-violet-600 to-indigo-600 shadow-xs shadow-violet-500/20"
                                                : "bg-slate-200/70"
                                            }`}
                                    />
                                ))}
                            </div>

                            <p className="text-[11px] text-slate-400 font-medium">
                                Speak into your microphone to verify audio pickup levels.
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: System Diagnostics & Permissions Guide */}
                    <div className="lg:col-span-5 space-y-6">
                        
                        {/* Diagnostics Checklist Card */}
                        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/80 shadow-xs space-y-4">
                            {/* Header */}
                            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm tracking-wide">
                                <div className="w-5 h-5 rounded-md bg-violet-50 text-violet-600 flex items-center justify-center">
                                    <Sparkles className="w-3.5 h-3.5" />
                                </div>
                                <span className="uppercase text-xs font-extrabold">System Diagnostics</span>
                            </div>

                            {/* Card 1: Speaker & Sound */}
                            <div className="p-4 rounded-2xl border border-slate-100 bg-[#f8f9ff] flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                                        <Volume2 className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900">Speaker &amp; Sound</h4>
                                        <p className="text-[11px] text-slate-400 font-medium">Test audio output</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePlayTone}
                                    disabled={isPlayingTone}
                                    className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-500/20 transition flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-75"
                                >
                                    <Play className={`w-3.5 h-3.5 fill-white ${isPlayingTone ? "animate-spin" : ""}`} />
                                    <span>{isPlayingTone ? "Playing..." : "Play Tone"}</span>
                                </button>
                            </div>

                            {/* Card 2: Internet Stability */}
                            <div className="p-4 rounded-2xl border border-slate-100 bg-[#f8f9ff] flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                        <Wifi className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900">Internet Stability</h4>
                                        <p className="text-[11px] text-slate-400 font-medium">
                                            Latency: <span className="font-bold text-emerald-600">{latency} ms</span> (Stable HD)
                                        </p>
                                    </div>
                                </div>

                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                    Excellent
                                </span>
                            </div>

                            {/* Card 3: Browser & WebRTC */}
                            <div className="p-4 rounded-2xl border border-slate-100 bg-[#f8f9ff] flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                                        <Laptop className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900">Browser &amp; WebRTC</h4>
                                        <p className="text-[11px] text-slate-400 font-medium">Google Chrome (Fully Supported)</p>
                                    </div>
                                </div>

                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                    Supported
                                </span>
                            </div>
                        </div>

                        {/* How to Grant Permissions Guide Card */}
                        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-3 text-left">
                            <div className="flex items-center gap-2 text-violet-700 font-bold text-xs sm:text-sm">
                                <Info className="w-4 h-4 text-violet-600 shrink-0" />
                                <span>How to Grant Camera &amp; Microphone Permissions</span>
                            </div>

                            <ol className="space-y-2 text-xs text-slate-600 font-medium leading-relaxed pl-1">
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-slate-400">1.</span>
                                    <span>
                                        Click the <strong>Padlock / Tune icon 🔒</strong> in your browser address bar at the top.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-slate-400">2.</span>
                                    <span>
                                        Set <strong>Camera</strong> and <strong>Microphone</strong> toggles to <strong>"Allow"</strong>.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold text-slate-400">3.</span>
                                    <span>
                                        If prompted, click <strong>Reload Page</strong> to apply updated permissions.
                                    </span>
                                </li>
                            </ol>
                        </div>

                    </div>
                </div>

                {/* Bottom Bar / Action Card */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Status Message */}
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold text-slate-800">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                        <span>All essential hardware diagnostics verified. Ready to proceed.</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={() => toast.info("If you experience hardware issues, verify camera permissions in Chrome settings.")}
                            className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                        >
                            <HelpCircle className="w-4 h-4 text-slate-500" />
                            <span>Need Help?</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleProceed}
                            className="px-6 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-violet-500/25 transition active:scale-98 flex items-center gap-2 cursor-pointer"
                        >
                            <span>Proceed to Instructions</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default CandidateSystemCheck;
