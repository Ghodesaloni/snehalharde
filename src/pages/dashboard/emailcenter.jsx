import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { emailApi, resumesApi } from "@/services/api";

const defaultTemplates = [
    { id: 1, name: "Interview Invitation", subject: "You're invited to interview for {{role}} at {{company}}", uses: 128, category: "Interview" },
    { id: 2, name: "Shortlist Confirmation", subject: "Great news! You've been shortlisted for {{role}}", uses: 94, category: "Status" },
    { id: 3, name: "Rejection Email", subject: "Update on your application for {{role}}", uses: 76, category: "Status" },
    { id: 4, name: "Offer Letter", subject: "Official Offer Letter - {{role}} at {{company}}", uses: 42, category: "Offer" },
];

const EmailCenter = () => {
    const [templates, setTemplates] = useState(defaultTemplates);
    const [candidates, setCandidates] = useState([]);
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [sending, setSending] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [currentUserEmail, setCurrentUserEmail] = useState("");

    // Compose form state
    const [composeForm, setComposeForm] = useState({
        recipient: "",
        recipientName: "",
        subject: "",
        body: "",
        templateId: null
    });

    const loadData = async () => {
        try {
            let userEmail = "";
            try {
                const u = JSON.parse(localStorage.getItem("avahire_user") || "{}");
                userEmail = u.email || "";
            } catch (_e) {
                userEmail = "";
            }
            setCurrentUserEmail(userEmail);

            const [tData, cData] = await Promise.all([
                emailApi.getTemplates().catch(() => defaultTemplates),
                resumesApi.getAll().catch(() => [])
            ]);
            if (tData && tData.length > 0) setTemplates(tData);
            if (cData) setCandidates(cData);
        } catch (err) {
            console.error("Failed to load email center data:", err);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleOpenCompose = (template = null) => {
        if (template) {
            setComposeForm({
                recipient: candidates[0]?.email || "",
                recipientName: candidates[0]?.name || "",
                subject: template.subject || "",
                body: template.body || `Hello,\n\nThis is regarding the ${template.name}.\n\nBest regards,\nAvaHire HR Team`,
                templateId: template.id
            });
        } else {
            setComposeForm({
                recipient: "",
                recipientName: "",
                subject: "",
                body: "",
                templateId: null
            });
        }
        setShowComposeModal(true);
    };

    const handleSelectCandidate = (candidateEmail) => {
        const cand = candidates.find(c => c.email === candidateEmail);
        if (cand) {
            setComposeForm(prev => ({
                ...prev,
                recipient: cand.email,
                recipientName: cand.name,
                subject: prev.subject.replace(/{{candidateName}}/g, cand.name).replace(/{{role}}/g, cand.role || "position").replace(/{{company}}/g, "AvaHire"),
                body: prev.body.replace(/{{candidateName}}/g, cand.name).replace(/{{role}}/g, cand.role || "position").replace(/{{company}}/g, "AvaHire")
            }));
        }
    };

    const handleSendEmail = async (e) => {
        e.preventDefault();
        if (!composeForm.recipient || !composeForm.subject) {
            return toast.error("Please provide recipient email and subject");
        }

        setSending(true);
        let userEmail = currentUserEmail;
        if (!userEmail) {
            try {
                const u = JSON.parse(localStorage.getItem("avahire_user") || "{}");
                userEmail = u.email || "";
            } catch (_e) {
                userEmail = "";
            }
        }

        try {
            const payload = {
                ...composeForm,
                senderEmail: userEmail,
                userEmail: userEmail,
            };
            await emailApi.send(payload);
            toast.success(`Email successfully dispatched to ${composeForm.recipient}!`);
            setShowComposeModal(false);
            setComposeForm({ recipient: "", recipientName: "", subject: "", body: "", templateId: null });
            
            // Refresh templates to update usage count
            const updatedTemplates = await emailApi.getTemplates();
            if (updatedTemplates) setTemplates(updatedTemplates);
        } catch (err) {
            console.error("Failed to dispatch email:", err);
            toast.error(err?.response?.data?.error || err.message || "Failed to dispatch email");
        } finally {
            setSending(false);
        }
    };

    const filteredTemplates = templates.filter(t => {
        const matchesCategory = categoryFilter === "all" || (t.category && t.category.toLowerCase() === categoryFilter.toLowerCase());
        const matchesSearch = !searchQuery.trim() || 
            t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            t.subject.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const categories = ["all", "Interview", "Status", "Offer"];

    return (
        <div className="space-y-6" data-testid="email-page">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Email Center</h2>
                    <p className="text-sm text-slate-500">Recruitment email templates and candidate communication dispatch</p>
                </div>
                <button
                    onClick={() => handleOpenCompose()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white rounded-full font-semibold text-sm shadow-md shadow-violet-500/25 transition cursor-pointer"
                >
                    <i className="fa-solid fa-pen"></i>
                    <span>Compose Email</span>
                </button>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Category:</span>
                    <div className="inline-flex rounded-xl bg-slate-100 p-1">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setCategoryFilter(cat)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer capitalize ${
                                    categoryFilter === cat ? "bg-white text-violet-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                }`}
                            >
                                {cat === "all" ? "All Templates" : cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative w-full sm:w-64">
                    <i className="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
                    <input
                        type="text"
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 focus:bg-white transition"
                    />
                </div>
            </div>

            {/* Templates Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTemplates.map((t) => (
                    <div key={t.id} className="bg-white rounded-2xl border border-slate-100 p-6 card-hover flex flex-col justify-between shadow-xs">
                        <div>
                            <div className="flex items-center justify-between">
                                <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center text-lg">
                                    <i className="fa-solid fa-envelope-open-text"></i>
                                </div>
                                {t.category && (
                                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                        {t.category}
                                    </span>
                                )}
                            </div>
                            <div className="mt-4 font-bold text-slate-900 text-base">{t.name}</div>
                            <div className="text-xs text-slate-500 mt-1 truncate font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">
                                {t.subject}
                            </div>
                        </div>
                        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                            <div className="text-xs text-slate-400 font-medium">
                                <i className="fa-solid fa-paper-plane mr-1 text-slate-300"></i>
                                {t.uses || 0} uses
                            </div>
                            <button
                                onClick={() => handleOpenCompose(t)}
                                className="text-violet-600 hover:text-violet-700 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                            >
                                <span>Use Template</span>
                                <i className="fa-solid fa-arrow-right text-[10px]"></i>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Compose Email Modal */}
            {showComposeModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">Compose Email</h3>
                                <p className="text-xs text-slate-500">Send candidate invitation or status updates</p>
                            </div>
                            <button
                                onClick={() => setShowComposeModal(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <form onSubmit={handleSendEmail} className="space-y-4 mt-4">
                            {/* Candidate Quick Select */}
                            {candidates.length > 0 && (
                                <div>
                                    <label className="text-xs font-semibold text-slate-700 block mb-1">Select from Candidates (Optional)</label>
                                    <select
                                        onChange={(e) => handleSelectCandidate(e.target.value)}
                                        className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none"
                                    >
                                        <option value="">-- Choose Candidate to auto-populate --</option>
                                        {candidates.map((c) => (
                                            <option key={c.id} value={c.email}>
                                                {c.name} ({c.role}) - {c.email}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">Recipient Email *</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="candidate@example.com"
                                    value={composeForm.recipient}
                                    onChange={(e) => setComposeForm({ ...composeForm, recipient: e.target.value })}
                                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">Subject *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Interview Invitation..."
                                    value={composeForm.subject}
                                    onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-semibold text-slate-700 block mb-1">Message Body</label>
                                <textarea
                                    rows={5}
                                    placeholder="Type your message or template details..."
                                    value={composeForm.body}
                                    onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                                    className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500 focus:outline-none font-sans"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowComposeModal(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="px-5 py-2 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-md shadow-violet-500/20 transition cursor-pointer flex items-center gap-2"
                                >
                                    {sending ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-paper-plane"></i>}
                                    <span>{sending ? "Sending..." : "Send Email"}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailCenter;
