import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { jobsApi } from "@/services/api";
import {
    FileText,
    MapPin,
    X,
    ChevronDown,
    Plus,
    Briefcase,
    Users,
    Clock,
    Building2,
    Search,
    MoreVertical,
    CheckCircle2,
    Tag,
    AlignLeft,
    Sparkles
} from "lucide-react";

const seedJobs = [
    {
        id: "job-1",
        title: "Senior Software Engineer",
        dept: "Engineering",
        jobLevel: "Senior Level",
        reportsTo: "Engineering Manager",
        loc: "Bangalore, India",
        isRemotePosition: false,
        workMode: "Hybrid",
        type: "Full-time",
        expLevel: "4-7 Years",
        description: "Looking for an experienced Senior Software Engineer to design scalable microservices, lead frontend architecture in React/Next.js, and mentor engineering teams.",
        keySkills: ["React", "Node.js", "TypeScript", "AWS", "System Design"],
        candidates: 18,
        status: "Active",
        posted: "20 May 2025"
    },
    {
        id: "job-2",
        title: "Python Developer",
        dept: "Engineering",
        jobLevel: "Mid Level",
        reportsTo: "Engineering Manager",
        loc: "Bangalore, India",
        isRemotePosition: false,
        workMode: "On-site",
        type: "Full-time",
        expLevel: "2-4 Years",
        description: "Join our backend platform team to build robust APIs, ETL pipelines, and high-performance services using FastAPI, Django, and PostgreSQL.",
        keySkills: ["Python", "FastAPI", "Django", "PostgreSQL", "Docker"],
        candidates: 24,
        status: "Active",
        posted: "18 May 2025"
    },
    {
        id: "job-3",
        title: "UI/UX Product Designer",
        dept: "Design",
        jobLevel: "Mid Level",
        reportsTo: "Design Lead",
        loc: "Mumbai, India",
        isRemotePosition: true,
        workMode: "Remote",
        type: "Full-time",
        expLevel: "3-5 Years",
        description: "Craft modern, intuitive design systems and end-to-end user experiences for our recruitment intelligence platform across web and mobile.",
        keySkills: ["Figma", "Design Systems", "User Research", "Wireframing", "Prototyping"],
        candidates: 12,
        status: "Active",
        posted: "15 May 2025"
    },
    {
        id: "job-4",
        title: "Data Analyst",
        dept: "Product",
        jobLevel: "Mid Level",
        reportsTo: "Director of Product",
        loc: "Hyderabad, India",
        isRemotePosition: false,
        workMode: "Hybrid",
        type: "Full-time",
        expLevel: "2-4 Years",
        description: "Analyze user behaviors, hiring funnels, and recruitment metrics to uncover actionable insights and drive product strategy with data visualizations.",
        keySkills: ["SQL", "Python", "Tableau", "Power BI", "Data Modeling"],
        candidates: 9,
        status: "Active",
        posted: "12 May 2025"
    }
];

const SUGGESTED_SKILLS = [
    "React",
    "Node.js",
    "Python",
    "TypeScript",
    "JavaScript",
    "SQL",
    "AWS",
    "Docker",
    "Figma",
    "Tailwind CSS",
    "GraphQL",
    "System Design",
    "Git",
    "FastAPI",
    "MongoDB",
    "PostgreSQL"
];

const defaultFormState = {
    title: "",
    dept: "Engineering",
    jobLevel: "Mid Level",
    reportsTo: "Engineering Manager",
    loc: "Karnataka",
    isRemotePosition: false,
    workMode: "On-site",
    type: "Full-time",
    expLevel: "3-5 Years",
    description: "",
    keySkills: []
};

const Jobs = () => {
    const [jobs, setJobs] = useState(seedJobs);
    const [q, setQ] = useState("");
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(defaultFormState);
    const [skillInput, setSkillInput] = useState("");
    const [selectedJobView, setSelectedJobView] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadJobs = async () => {
            try {
                const data = await jobsApi.getAll();
                if (data && data.length > 0) {
                    setJobs(data);
                }
            } catch (err) {
                console.error("Failed to load jobs from database:", err);
            }
        };
        loadJobs();
    }, []);

    const filtered = jobs.filter((j) =>
        j.title.toLowerCase().includes(q.toLowerCase()) ||
        j.dept.toLowerCase().includes(q.toLowerCase()) ||
        j.loc.toLowerCase().includes(q.toLowerCase()) ||
        (j.keySkills && j.keySkills.some(skill => skill.toLowerCase().includes(q.toLowerCase())))
    );

    const handleAddSkill = (skillToAdd) => {
        const trimmed = (skillToAdd || skillInput).trim();
        if (!trimmed) return;
        if (form.keySkills.some(s => s.toLowerCase() === trimmed.toLowerCase())) {
            toast.info(`"${trimmed}" is already in the skills list`);
            setSkillInput("");
            return;
        }
        setForm(prev => ({
            ...prev,
            keySkills: [...prev.keySkills, trimmed]
        }));
        setSkillInput("");
    };

    const handleRemoveSkill = (skillToRemove) => {
        setForm(prev => ({
            ...prev,
            keySkills: prev.keySkills.filter(s => s !== skillToRemove)
        }));
    };

    const handleSkillKeyDown = (e) => {
        if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            handleAddSkill();
        }
    };

    const submit = async (e) => {
        e?.preventDefault();
        if (!form.title.trim() || !form.dept.trim()) {
            return toast.error("Please fill in the required fields");
        }

        setIsSubmitting(true);
        const jobPayload = {
            ...form,
            keySkills: form.keySkills.length > 0 ? form.keySkills : (skillInput.trim() ? [skillInput.trim()] : []),
            candidates: 0,
            status: "Active",
            posted: "Just now"
        };

        try {
            const savedJob = await jobsApi.create(jobPayload);
            setJobs([savedJob, ...jobs]);
            toast.success("Job posting created and saved to database!");
        } catch (err) {
            console.error("Backend error, adding locally:", err);
            const localJob = { id: `job-${Date.now()}`, ...jobPayload };
            setJobs([localJob, ...jobs]);
            toast.success("Job posting created!");
        } finally {
            setIsSubmitting(false);
            setModal(false);
            setForm(defaultFormState);
            setSkillInput("");
        }
    };

    return (
        <div className="space-y-6" data-testid="jobs-page">
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Jobs</h2>
                    <p className="text-sm text-slate-500">Manage your active job postings and open vacancies</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                            data-testid="jobs-search"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                            placeholder="Search jobs, departments, skills..."
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm w-64 sm:w-72 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition shadow-xs"
                        />
                    </div>
                    <button
                        data-testid="new-job-btn"
                        onClick={() => {
                            setForm(defaultFormState);
                            setSkillInput("");
                            setModal(true);
                        }}
                        className="btn-primary px-5 py-2.5 rounded-full text-white font-semibold text-sm flex items-center gap-2 shadow-md shadow-violet-500/25 transition active:scale-95 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" /> New Job
                    </button>
                </div>
            </div>

            {/* Jobs Cards Grid */}
            {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center" data-testid="empty-jobs-state">
                    <div className="w-16 h-16 bg-violet-50 text-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-xl">
                        <Briefcase className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900">No jobs found</h3>
                    <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">
                        {q ? "No jobs match your search query." : "Get started by creating your first job posting."}
                    </p>
                    {!q && (
                        <button
                            onClick={() => {
                                setForm(defaultFormState);
                                setSkillInput("");
                                setModal(true);
                            }}
                            className="btn-primary px-5 py-2.5 rounded-full text-white font-semibold text-sm mt-4 inline-flex items-center gap-2 shadow-md shadow-violet-500/25 cursor-pointer"
                        >
                            <Plus className="w-4 h-4" /> New Job
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {filtered.map((j) => (
                        <div key={j.id} data-testid={`job-card-${j.id}`} className="bg-white rounded-2xl border border-slate-100 p-6 card-hover flex flex-col justify-between shadow-xs">
                            <div>
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="text-lg font-bold text-slate-900 tracking-tight leading-snug">{j.title}</div>
                                        <div className="text-xs font-semibold text-violet-600 mt-1 flex items-center gap-1.5">
                                            <Building2 className="w-3.5 h-3.5" />
                                            <span>{j.dept}</span>
                                            {j.jobLevel && (
                                                <>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="text-slate-500 font-medium">{j.jobLevel}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${j.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                                        {j.status}
                                    </span>
                                </div>

                                {j.description && (
                                    <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                                        {j.description}
                                    </p>
                                )}

                                {/* Key Skills Badges */}
                                {j.keySkills && j.keySkills.length > 0 && (
                                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                                        {j.keySkills.slice(0, 4).map((skill, sIdx) => (
                                            <span
                                                key={sIdx}
                                                className="text-[11px] font-medium px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                        {j.keySkills.length > 4 && (
                                            <span className="text-[11px] font-medium px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded-md border border-slate-100">
                                                +{j.keySkills.length - 4} more
                                            </span>
                                        )}
                                    </div>
                                )}

                                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-600">
                                    <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1 font-medium">
                                        <MapPin className="w-3 h-3 text-slate-400" />
                                        {j.loc}
                                    </span>
                                    <span className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-1 font-medium">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        {j.type}
                                    </span>
                                    {j.workMode && (
                                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 font-medium">
                                            {j.workMode}
                                        </span>
                                    )}
                                    <span className="px-2.5 py-1 rounded-lg bg-violet-50 text-violet-700 border border-violet-100 font-semibold flex items-center gap-1">
                                        <Users className="w-3 h-3 text-violet-500" />
                                        {j.candidates} candidates
                                    </span>
                                </div>
                            </div>

                            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                                <span className="text-slate-400 font-medium">Posted {j.posted}</span>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setSelectedJobView(j)}
                                        className="text-violet-600 font-bold hover:text-violet-700 transition cursor-pointer"
                                    >
                                        View
                                    </button>
                                    <button className="text-slate-400 hover:text-slate-700 transition p-1 cursor-pointer">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* View Job Details Modal */}
            {selectedJobView && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
                    <div className="bg-white rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
                            <div>
                                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${selectedJobView.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                                    {selectedJobView.status}
                                </span>
                                <h3 className="text-xl font-bold text-slate-900 mt-2">{selectedJobView.title}</h3>
                                <p className="text-sm text-violet-600 font-semibold mt-0.5 flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4" />
                                    {selectedJobView.dept} • {selectedJobView.jobLevel || "Mid Level"}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedJobView(null)}
                                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="mt-5 space-y-5">
                            {/* Key Highlights */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[11px] text-slate-400 font-medium block">Location</span>
                                    <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">{selectedJobView.loc}</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[11px] text-slate-400 font-medium block">Work Mode</span>
                                    <span className="text-xs font-bold text-slate-800 mt-0.5 block">{selectedJobView.workMode || "On-site"}</span>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[11px] text-slate-400 font-medium block">Experience</span>
                                    <span className="text-xs font-bold text-slate-800 mt-0.5 block">{selectedJobView.expLevel || "3-5 Years"}</span>
                                </div>
                            </div>

                            {/* Job Description */}
                            {selectedJobView.description && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <AlignLeft className="w-3.5 h-3.5 text-violet-600" /> Job Description
                                    </h4>
                                    <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        {selectedJobView.description}
                                    </p>
                                </div>
                            )}

                            {/* Key Skills */}
                            {selectedJobView.keySkills && selectedJobView.keySkills.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Tag className="w-3.5 h-3.5 text-blue-600" /> Required Key Skills
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedJobView.keySkills.map((skill, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg text-xs font-semibold"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedJobView(null)}
                                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create New Job Modal */}
            {modal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in" data-testid="new-job-modal">
                    <div className="bg-white rounded-3xl w-full max-w-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between pb-6 border-b border-slate-100">
                            <div className="flex items-center gap-3.5">
                                <div className="w-11 h-11 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                                    <FileText className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                                        Create New Job Posting
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                        Add the essential details, role description, and key skills required.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setModal(false)}
                                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={submit} className="mt-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                {/* Job Title * */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                        Job Title <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        data-testid="job-form-title"
                                        value={form.title}
                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                        placeholder="e.g. Senior Software Engineer"
                                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                                    />
                                </div>

                                {/* Job Level */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                        Job Level
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={form.jobLevel}
                                            onChange={(e) => setForm({ ...form, jobLevel: e.target.value })}
                                            className="w-full appearance-none px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
                                        >
                                            <option>Mid Level</option>
                                            <option>Entry Level / Junior</option>
                                            <option>Senior Level</option>
                                            <option>Lead / Principal</option>
                                            <option>Director / Executive</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Department * */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                        Department <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            data-testid="job-form-dept"
                                            value={form.dept}
                                            onChange={(e) => setForm({ ...form, dept: e.target.value })}
                                            className="w-full appearance-none px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
                                        >
                                            <option>Engineering</option>
                                            <option>Product</option>
                                            <option>Design</option>
                                            <option>Marketing</option>
                                            <option>Sales</option>
                                            <option>Human Resources</option>
                                            <option>Finance</option>
                                            <option>Operations</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Location * */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                        Location <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                        <select
                                            value={form.loc}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                const isRemote = val.toLowerCase().includes("remote");
                                                setForm({
                                                    ...form,
                                                    loc: val,
                                                    isRemotePosition: isRemote ? true : form.isRemotePosition,
                                                    workMode: isRemote ? "Remote" : form.workMode
                                                });
                                            }}
                                            className="w-full appearance-none pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
                                        >
                                            <optgroup>
                                                <option value="Andhra Pradesh">Andhra Pradesh</option>
                                                <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                                                <option value="Assam">Assam</option>
                                                <option value="Bihar">Bihar</option>
                                                <option value="Chhattisgarh">Chhattisgarh</option>
                                                <option value="Goa">Goa</option>
                                                <option value="Gujarat">Gujarat</option>
                                                <option value="Haryana">Haryana</option>
                                                <option value="Himachal Pradesh">Himachal Pradesh</option>
                                                <option value="Jharkhand">Jharkhand</option>
                                                <option value="Karnataka">Karnataka</option>
                                                <option value="Kerala">Kerala</option>
                                                <option value="Madhya Pradesh">Madhya Pradesh</option>
                                                <option value="Maharashtra">Maharashtra</option>
                                                <option value="Manipur">Manipur</option>
                                                <option value="Meghalaya">Meghalaya</option>
                                                <option value="Mizoram">Mizoram</option>
                                                <option value="Nagaland">Nagaland</option>
                                                <option value="Odisha">Odisha</option>
                                                <option value="Punjab">Punjab</option>
                                                <option value="Rajasthan">Rajasthan</option>
                                                <option value="Sikkim">Sikkim</option>
                                                <option value="Tamil Nadu">Tamil Nadu</option>
                                                <option value="Telangana">Telangana</option>
                                                <option value="Tripura">Tripura</option>
                                                <option value="Uttar Pradesh">Uttar Pradesh</option>
                                                <option value="Uttarakhand">Uttarakhand</option>
                                                <option value="West Bengal">West Bengal</option>
                                                <option value="Delhi">Delhi</option>
                                                <option value="Chandigarh">Chandigarh</option>
                                                <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                                                <option value="Ladakh">Ladakh</option>
                                                <option value="Lakshadweep">Lakshadweep</option>
                                                <option value="Puducherry">Puducherry</option>
                                                <option value="Remote">Remote</option>
                                            </optgroup>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>

                                    {/* Remote Position Checkbox */}
                                    <label className="flex items-center gap-2.5 mt-2.5 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={form.isRemotePosition}
                                            onChange={(e) => setForm({ ...form, isRemotePosition: e.target.checked })}
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                                        />
                                        <span className="text-xs font-semibold text-slate-700">Remote Position</span>
                                    </label>
                                </div>

                                {/* Work Mode * */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                        Work Mode <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {["On-site", "Hybrid", "Remote"].map((mode) => {
                                            const isActive = form.workMode === mode;
                                            return (
                                                <button
                                                    key={mode}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, workMode: mode })}
                                                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition text-center cursor-pointer ${isActive
                                                        ? "bg-blue-50/70 border-2 border-blue-500 text-blue-600 shadow-xs"
                                                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                                        }`}
                                                >
                                                    {mode}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Employment Type * */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                        Employment Type <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {["Full-time", "Part-time", "Contract", "Internship"].map((type) => {
                                            const isActive = form.type === type;
                                            return (
                                                <button
                                                    key={type}
                                                    type="button"
                                                    onClick={() => setForm({ ...form, type: type })}
                                                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition text-center whitespace-nowrap cursor-pointer ${isActive
                                                        ? "bg-blue-50/70 border-2 border-blue-500 text-blue-600 shadow-xs"
                                                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                                                        }`}
                                                >
                                                    {type}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Experience Level * */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                        Experience Level <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={form.expLevel}
                                            onChange={(e) => setForm({ ...form, expLevel: e.target.value })}
                                            className="w-full appearance-none px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
                                        >
                                            <option>3-5 Years</option>
                                            <option>0-1 Years</option>
                                            <option>1-3 Years</option>
                                            <option>5-8 Years</option>
                                            <option>8+ Years</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                {/* JOB DESCRIPTION BOX */}
                                <div className="col-span-1 md:col-span-2">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                            <AlignLeft className="w-3.5 h-3.5 text-blue-600" />
                                            Job Description
                                        </label>
                                        <span className="text-[11px] text-slate-400">
                                            {form.description.length} characters
                                        </span>
                                    </div>
                                    <textarea
                                        rows={4}
                                        data-testid="job-form-description"
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                        placeholder="Describe the role responsibilities, ideal candidate background, mission, and key daily expectations..."
                                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition resize-y leading-relaxed"
                                    />
                                    <p className="text-[11px] text-slate-400 mt-1">
                                        Provide a clear summary of what candidates will be doing in this role.
                                    </p>
                                </div>

                                {/* KEY SKILLS */}
                                <div className="col-span-1 md:col-span-2">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                            <Tag className="w-3.5 h-3.5 text-blue-600" />
                                            Key Skills
                                        </label>
                                        <span className="text-[11px] text-slate-400">
                                            {form.keySkills.length} skill{form.keySkills.length === 1 ? "" : "s"} added
                                        </span>
                                    </div>

                                    {/* Skills Input Bar */}
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <input
                                                type="text"
                                                data-testid="job-form-skill-input"
                                                value={skillInput}
                                                onChange={(e) => setSkillInput(e.target.value)}
                                                onKeyDown={handleSkillKeyDown}
                                                placeholder="Type a skill and press Enter (e.g. React, Python, AWS)..."
                                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleAddSkill()}
                                            disabled={!skillInput.trim()}
                                            className="px-4 py-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50 disabled:pointer-events-none rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 border border-blue-200 cursor-pointer"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> Add
                                        </button>
                                    </div>

                                    {/* Added Skills Pill Badges */}
                                    {form.keySkills.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                                            {form.keySkills.map((skill) => (
                                                <span
                                                    key={skill}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-blue-200 text-blue-700 rounded-full text-xs font-semibold shadow-2xs group"
                                                >
                                                    {skill}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveSkill(skill)}
                                                        className="text-slate-400 hover:text-rose-600 transition -mr-0.5 cursor-pointer"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </span>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setForm(prev => ({ ...prev, keySkills: [] }))}
                                                className="text-[11px] text-slate-400 hover:text-rose-500 font-semibold px-2 py-1 transition cursor-pointer"
                                            >
                                                Clear all
                                            </button>
                                        </div>
                                    )}

                                    {/* Suggested Skills Quick-Add */}
                                    <div className="mt-2.5">
                                        <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 mb-1.5">
                                            <Sparkles className="w-3 h-3 text-amber-500" /> Suggested Skills (Click to add):
                                        </span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {SUGGESTED_SKILLS.filter(s => !form.keySkills.some(existing => existing.toLowerCase() === s.toLowerCase())).slice(0, 10).map((skill) => (
                                                <button
                                                    key={skill}
                                                    type="button"
                                                    onClick={() => handleAddSkill(skill)}
                                                    className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 border border-slate-200/60 transition flex items-center gap-1 cursor-pointer"
                                                >
                                                    <Plus className="w-3 h-3 text-slate-400" /> {skill}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer Actions */}
                            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setModal(false)}
                                    className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    data-testid="job-form-submit"
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/25 transition active:scale-[0.98] cursor-pointer"
                                >
                                    Create Job
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Jobs;
