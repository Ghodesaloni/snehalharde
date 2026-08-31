import React, { useState } from "react";
import { toast } from "sonner";
import {
    FileText,
    MapPin,
    X,
    ChevronDown,
    Plus,
    Minus,
    Briefcase,
    Users,
    Clock,
    Building2,
    Search,
    MoreVertical,
    CheckCircle2
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
        openings: 3,
        expLevel: "4-7 Years",
        noticePeriod: "30 Days",
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
        openings: 2,
        expLevel: "2-4 Years",
        noticePeriod: "30 Days",
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
        openings: 1,
        expLevel: "3-5 Years",
        noticePeriod: "Immediate / 15 Days",
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
        openings: 2,
        expLevel: "2-4 Years",
        noticePeriod: "30 Days",
        candidates: 9,
        status: "Active",
        posted: "12 May 2025"
    }
];

const defaultFormState = {
    title: "Senior Software Engineer",
    dept: "Engineering",
    jobLevel: "Mid Level",
    reportsTo: "Engineering Manager",
    loc: "Karnataka",
    isRemotePosition: false,
    workMode: "On-site",
    type: "Full-time",
    openings: 2,
    expLevel: "3-5 Years",
    noticePeriod: "30 Days"
};

const Jobs = () => {
    const [jobs, setJobs] = useState(seedJobs);
    const [q, setQ] = useState("");
    const [modal, setModal] = useState(false);
    const [form, setForm] = useState(defaultFormState);

    const filtered = jobs.filter((j) =>
        j.title.toLowerCase().includes(q.toLowerCase()) ||
        j.dept.toLowerCase().includes(q.toLowerCase()) ||
        j.loc.toLowerCase().includes(q.toLowerCase())
    );

    const submit = (e) => {
        e?.preventDefault();
        if (!form.title.trim() || !form.dept.trim()) {
            return toast.error("Please fill in the required fields");
        }

        const newJob = {
            id: `job-${Date.now()}`,
            ...form,
            candidates: 0,
            status: "Active",
            posted: "Just now"
        };

        setJobs([newJob, ...jobs]);
        setModal(false);
        setForm(defaultFormState);
        toast.success("Job posting created successfully!");
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
                            placeholder="Search jobs, departments..."
                            className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-full text-sm w-64 sm:w-72 focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-100 transition shadow-xs"
                        />
                    </div>
                    <button
                        data-testid="new-job-btn"
                        onClick={() => setModal(true)}
                        className="btn-primary px-5 py-2.5 rounded-full text-white font-semibold text-sm flex items-center gap-2 shadow-md shadow-violet-500/25 transition active:scale-95"
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
                            onClick={() => setModal(true)}
                            className="btn-primary px-5 py-2.5 rounded-full text-white font-semibold text-sm mt-4 inline-flex items-center gap-2 shadow-md shadow-violet-500/25"
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
                                    {j.openings && (
                                        <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-100 font-medium">
                                            {j.openings} opening{j.openings > 1 ? "s" : ""}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                                <span className="text-slate-400 font-medium">Posted {j.posted}</span>
                                <div className="flex items-center gap-3">
                                    <button onClick={() => toast.info(`Viewing details for ${j.title}`)} className="text-violet-600 font-bold hover:text-violet-700 transition">
                                        View
                                    </button>
                                    <button className="text-slate-400 hover:text-slate-700 transition p-1">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create New Job Modal Matching Uploaded Image */}
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
                                        Basic Information
                                    </h3>
                                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                                        Add the essential details about the role.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setModal(false)}
                                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-100 transition"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={submit} className="mt-6 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                                {/* LEFT COLUMN */}

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
                                        placeholder="Senior Software Engineer"
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
                                                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition text-center ${isActive
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
                                                    className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition text-center whitespace-nowrap ${isActive
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

                                {/* Number of Openings */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                        Number of Openings
                                    </label>
                                    <div className="inline-flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setForm({ ...form, openings: Math.max(1, (form.openings || 1) - 1) })
                                            }
                                            className="px-3.5 py-2 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition"
                                        >
                                            <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="px-5 py-2 font-bold text-slate-800 text-sm border-x border-slate-100 min-w-[40px] text-center">
                                            {form.openings}
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setForm({ ...form, openings: (form.openings || 1) + 1 })}
                                            className="px-3.5 py-2 hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition"
                                        >
                                            <Plus className="w-3.5 h-3.5" />
                                        </button>
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

                                {/* Notice Period (Optional) */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-800 mb-1.5">
                                        Notice Period (Optional)
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={form.noticePeriod}
                                            onChange={(e) => setForm({ ...form, noticePeriod: e.target.value })}
                                            className="w-full appearance-none px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
                                        >
                                            <option>30 Days</option>
                                            <option>Immediate / 15 Days</option>
                                            <option>45 Days</option>
                                            <option>60 Days</option>
                                            <option>90 Days</option>
                                            <option>NA</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer Actions */}
                            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setModal(false)}
                                    className="px-5 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    data-testid="job-form-submit"
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-500/25 transition active:scale-[0.98]"
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
