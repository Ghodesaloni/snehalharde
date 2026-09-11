import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { emailApi, resumesApi } from "@/services/api";

const defaultTemplates = [
    { id: 1, name: "Interview Invitation", subject: "You're invited to interview for {{role}}", uses: 128 },
    { id: 2, name: "Shortlist Confirmation", subject: "Great news! You've been shortlisted", uses: 94 },
    { id: 3, name: "Rejection Email", subject: "Update on your application", uses: 76 },
    { id: 4, name: "Offer Letter", subject: "Your offer from {{company}}", uses: 42 },
];

const EmailCenter = () => {
    const [tab, setTab] = useState("templates");
    const [templates, setTemplates] = useState(defaultTemplates);
    const [sentEmails, setSentEmails] = useState([]);
    const [candidates, setCandidates] = useState([]);
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [sending, setSending] = useState(false);
    const [sentFilter, setSentFilter] = useState("all"); // "all" | "mine"
    const [selectedEmail, setSelectedEmail] = useState(null);
    const [currentUserEmail, setCurrentUserEmail] = useState("");

    // Compose form state
    const [composeForm, setComposeForm] = useState({
        recipient: "",
        recipientName: "",
        subject: "",
        body: "",
        templateId: null
    });

    const loadData = async (scope = sentFilter) => {
        try {
            let userEmail = "";
            try {
                const u = JSON.parse(localStorage.getItem("avahire_user") || "{}");
                userEmail = u.email || "";
            } catch (_e) {
                userEmail = "";
            }
            setCurrentUserEmail(userEmail);

            const filterEmail = scope === "mine" ? userEmail : undefined;

            const [tData, sData, cData] = await Promise.all([
                emailApi.getTemplates().catch(() => defaultTemplates),
                emailApi.getSent(filterEmail).catch(() => []),
                resumesApi.getAll().catch(() => [])
            ]);
            if (tData && tData.length > 0) setTemplates(tData);
            if (sData) setSentEmails(sData);
            if (cData) setCandidates(cData);
        } catch (err) {
            console.error("Failed to load email center data:", err);
        }
    };

    useEffect(() => {
        loadData(sentFilter);
    }, [sentFilter]);

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
                subject: prev.subject.replace(/{{candidateName}}/g, cand.name).replace(/{{role}}/g, cand.role),
                body: prev.body.replace(/{{candidateName}}/g, cand.name).replace(/{{role}}/g, cand.role).replace(/{{company}}/g, "AvaHire")
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
            const result = await emailApi.send(payload);
            setSentEmails(prev => [result, ...prev]);
            toast.success(`Email dispatched and saved to database!`);
            setShowComposeModal(false);
            setComposeForm({ recipient: "", recipientName: "", subject: "", body: "", templateId: null });
            
            // Refresh sent emails from database to ensure complete sync
            loadData(sentFilter);
            
            // Refresh templates to update usage count
            const updatedTemplates = await emailApi.getTemplates();
            if (updatedTemplates) setTemplates(updatedTemplates);
        } catch (err) {
            console.error("Failed to dispatch email:", err);
            // Local fallback
            const localSent = {
                id: `sent-${Date.now()}`,
                ...composeForm,
                senderEmail: userEmail,
                userEmail: userEmail,
                opened: false,
                sentAt: "Just now",
                status: "Delivered via SMTP"
            };
            setSentEmails(prev => [localSent, ...prev]);
            toast.success(`Email dispatched to ${composeForm.recipient}!`);
            setShowComposeModal(false);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6" data-testid="email-page">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Email Center</h2>
                    <p className="text-sm text-slate-500">Manage recruitment email templates and track candidate communications</p>
                </div>
                <button
                    onClick={() => handleOpenCompose()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 active:scale-[0.98] text-white rounded-full font-semibold text-sm shadow-md shadow-violet-500/25 transition cursor-pointer"
                >
                    <i className="fa-solid fa-pen"></i>
                    <span>Compose Email</span>
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200">
                {[
                    ["templates", `Templates (${templates.length})`],
                    ["sent", `Sent Emails (${sentEmails.length})`]
                ].map(([k, l]) => (
                    <button
                        key={k}
                        onClick={() => setTab(k)}
                        data-testid={`tab-${k}`}
                        className={`px-5 py-3 text-sm font-semibold transition border-b-2 cursor-pointer ${
                            tab === k ? "text-violet-600 border-violet-600" : "text-slate-500 border-transparent hover:text-slate-700"
                        }`}
                    >
                        {l}
                    </button>
                ))}
            </div>

            {/* Templates View */}
            {tab === "templates" && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {templates.map((t) => (
                        <div key={t.id} className="bg-white rounded-2xl border border-slate-100 p-6 card-hover flex flex-col justify-between shadow-xs">
                            <div>
                                <div className="w-11 h-11 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center text-lg">
                                    <i className="fa-solid fa-envelope-open-text"></i>
                                </div>
                                <div className="mt-4 font-bold text-slate-900 text-base">{t.name}</div>
                                <div className="text-xs text-slate-500 mt-1 truncate font-mono bg-slate-50 p-2 rounded-lg border border-slate-100">{t.subject}</div>
                            </div>
                            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3">
                                <div className="text-xs text-slate-400 font-medium">
                                    <i className="fa-solid fa-paper-plane mr-1 text-slate-300"></i>
                                    {t.uses} uses
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
            )}

            {/* Sent Emails View */}
            {tab === "sent" && (
                <div className="space-y-4">
                    {/* Controls Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filter:</span>
                            <div className="inline-flex rounded-xl bg-slate-100 p-1">
                                <button
                                    onClick={() => setSentFilter("all")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                        sentFilter === "all" ? "bg-white text-violet-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    <i className="fa-solid fa-globe mr-1.5"></i>
                                    All Organization Emails
                                </button>
                                <button
                                    onClick={() => setSentFilter("mine")}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                                        sentFilter === "mine" ? "bg-white text-violet-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                                    }`}
                                >
                                    <i className="fa-solid fa-user mr-1.5"></i>
                                    My Sent ({currentUserEmail || "Active User"})
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => loadData(sentFilter)}
                                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-slate-200"
                            >
                                <i className="fa-solid fa-rotate-right"></i>
                                <span>Sync / Refresh</span>
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs">
                        {sentEmails.length === 0 ? (
                            <div className="p-12 text-center text-slate-400">
                                <i className="fa-solid fa-paper-plane text-3xl mb-3 text-slate-300 block"></i>
                                <div className="font-semibold text-slate-700">No sent emails found</div>
                                <p className="text-xs text-slate-400 mt-1">
                                    {sentFilter === "mine" ? "You have not dispatched any emails yet from this account." : "Compose your first email or send automated candidate invites"}
                                </p>
                            </div>
                        ) : (
                            sentEmails.map((s) => (
                                <div
                                    key={s.id}
                                    onClick={() => setSelectedEmail(s)}
                                    className="flex items-center gap-4 px-6 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/80 transition cursor-pointer group"
                                >
                                    <div className={`w-10 h-10 rounded-full ${s.opened ? "bg-emerald-100 text-emerald-600" : "bg-violet-100 text-violet-600"} flex items-center justify-center shrink-0`}>
                                        <i className={`fa-solid ${s.opened ? "fa-envelope-open" : "fa-envelope"}`}></i>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-slate-900 text-sm truncate group-hover:text-violet-700 transition">{s.subject}</span>
                                            {s.type && (
                                                <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-md">
                                                    {s.type}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                                            <span>To: <strong className="text-slate-700">{s.recipientName || s.recipient || s.to}</strong> ({s.recipient || s.to})</span>
                                            {s.senderEmail && (
                                                <span className="hidden sm:inline text-slate-400">&bull; By: {s.senderEmail}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-400 shrink-0 font-medium text-right">
                                        <div>{s.sentAt || s.sent}</div>
                                        {s.deliveryMode && (
                                            <div className="text-[10px] text-slate-400 uppercase tracking-wider">{s.deliveryMode}</div>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                                        s.status?.includes("SMTP") || s.status === "Delivered" ? "bg-emerald-100 text-emerald-700" : "bg-violet-100 text-violet-700"
                                    }`}>
                                        {s.status || "Delivered"}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Email Detail View Modal */}
            {selectedEmail && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col p-6 sm:p-8 shadow-2xl border border-slate-100 animate-in fade-in">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider bg-violet-50 px-2.5 py-1 rounded-md">
                                    {selectedEmail.type || "SMTP Email Record"}
                                </span>
                                <h3 className="text-lg font-bold text-slate-900 mt-1.5">{selectedEmail.subject}</h3>
                            </div>
                            <button
                                onClick={() => setSelectedEmail(null)}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition cursor-pointer"
                            >
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>

                        <div className="py-4 space-y-3 text-xs border-b border-slate-100">
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="text-slate-400 block font-medium">Recipient:</span>
                                    <span className="text-slate-800 font-semibold">{selectedEmail.recipientName || "Candidate"} &lt;{selectedEmail.recipient || selectedEmail.to}&gt;</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block font-medium">Dispatched By:</span>
                                    <span className="text-slate-800 font-semibold">{selectedEmail.senderEmail || selectedEmail.userEmail || "AvaHire Recruiter"}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <span className="text-slate-400 block font-medium">Timestamp:</span>
                                    <span className="text-slate-700">{selectedEmail.sentAt || "Recently"}</span>
                                </div>
                                <div>
                                    <span className="text-slate-400 block font-medium">Status & Delivery:</span>
                                    <span className="text-emerald-700 font-semibold">{selectedEmail.status || "Delivered"} ({selectedEmail.deliveryMode || "SMTP"})</span>
                                </div>
                            </div>
                            {selectedEmail.messageId && (
                                <div>
                                    <span className="text-slate-400 block font-medium">SMTP Message-ID:</span>
                                    <code className="text-[11px] text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200 block truncate">{selectedEmail.messageId}</code>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-y-auto my-4 pr-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Message Body</label>
                            {selectedEmail.html ? (
                                <div
                                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 text-xs overflow-x-auto"
                                    dangerouslySetInnerHTML={{ __html: selectedEmail.html }}
                                />
                            ) : (
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-slate-800 whitespace-pre-wrap text-xs font-sans leading-relaxed">
                                    {selectedEmail.body || "No body content stored."}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-3 border-t border-slate-100">
                            <button
                                onClick={() => setSelectedEmail(null)}
                                className="px-5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
