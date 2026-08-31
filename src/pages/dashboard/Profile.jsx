import React, { useState } from "react";
import { toast } from "sonner";
import {
    Mail,
    Phone,
    MapPin,
    Calendar,
    Clock,
    Camera,
    Linkedin,
    CheckCircle2,
    Circle,
    Briefcase,
    Users,
    Video,
    Award,
    Building2,
    Globe,
    Bell,
    ChevronDown,
    Save,
    Sparkles
} from "lucide-react";

const Profile = () => {
    const [activeTab, setActiveTab] = useState("personal");

    // Profile Data State
    const [profile, setProfile] = useState(() => {
        const saved = localStorage.getItem("avahire_hr_profile");
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {}
        }
        return {
            fullName: "Priya Mehta",
            dob: "1991-08-14",
            displayDob: "14/08/1991",
            email: "priya.mehta@techcorp.com",
            gender: "Female",
            phone: "+91 98765 43210",
            location: "Mumbai, Maharashtra, India",
            jobTitle: "HR Administrator",
            linkedin: "https://linkedin.com/in/priyamehta",
            department: "Human Resources",
            bio: "HR professional with 6+ years of experience in talent acquisition, employee engagement and HR operations.",
            avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=300",
            companyName: "TechCorp Solutions Pvt. Ltd.",
            companyWebsite: "https://techcorp.com",
            companySize: "250 - 500 Employees",
            industry: "Software & Technology"
        };
    });

    const [avatarPhoto, setAvatarPhoto] = useState(profile.avatar);

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (uploadEvent) => {
                const newUrl = uploadEvent.target?.result;
                setAvatarPhoto(newUrl);
                setProfile((prev) => ({ ...prev, avatar: newUrl }));
                toast.success("Profile photo updated!");
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = (e) => {
        e?.preventDefault();
        localStorage.setItem("avahire_hr_profile", JSON.stringify(profile));

        // Also update avahire_user in localStorage so the header initials and name reflect
        const existingUser = JSON.parse(localStorage.getItem("avahire_user") || "{}");
        localStorage.setItem(
            "avahire_user",
            JSON.stringify({
                ...existingUser,
                name: profile.fullName,
                email: profile.email,
                designation: profile.jobTitle,
                company: profile.companyName
            })
        );

        toast.success("HR Profile updated successfully!");
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto -mt-2" data-testid="hr-profile-page">
            {/* Header */}
            <div>
                <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight">
                    HR Profile
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Manage your personal information and view your HR account overview.
                </p>
            </div>

            {/* 3-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* LEFT COLUMN: Summary Card (3 cols) */}
                <div className="lg:col-span-3 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    {/* Top banner */}
                    <div className="h-24 bg-gradient-to-r from-violet-100/70 to-indigo-100/70 relative" />

                    {/* Avatar with Camera badge */}
                    <div className="px-6 pb-6 text-center -mt-14 space-y-4">
                        <div className="relative inline-block mx-auto">
                            <img
                                src={avatarPhoto}
                                alt={profile.fullName}
                                className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md mx-auto"
                            />
                            <label
                                htmlFor="avatar-upload"
                                className="absolute bottom-0 right-0 w-8 h-8 bg-violet-600 hover:bg-violet-700 text-white rounded-full flex items-center justify-center cursor-pointer shadow-sm transition border-2 border-white"
                                title="Change Profile Photo"
                            >
                                <Camera className="w-4 h-4" />
                                <input
                                    id="avatar-upload"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarChange}
                                />
                            </label>
                        </div>

                        {/* Name & Badge */}
                        <div>
                            <div className="flex items-center justify-center gap-2">
                                <h2 className="text-lg font-bold text-slate-900">{profile.fullName}</h2>
                                <span className="px-2.5 py-0.5 rounded-full bg-violet-100 text-violet-700 font-bold text-[11px]">
                                    HR Admin
                                </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 font-medium">
                                Human Resources Administrator
                            </div>
                        </div>

                        {/* Details List */}
                        <div className="space-y-3 pt-3 border-t border-slate-100 text-left text-xs text-slate-600">
                            {/* Email */}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                    <Mail className="w-4 h-4" />
                                </div>
                                <span className="truncate font-medium">{profile.email}</span>
                            </div>

                            {/* Phone */}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                    <Phone className="w-4 h-4" />
                                </div>
                                <span className="font-medium">{profile.phone}</span>
                            </div>

                            {/* Location */}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <span className="font-medium">{profile.location}</span>
                            </div>

                            {/* Joined Date */}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <span className="font-medium">Joined on 12 Jan, 2024</span>
                            </div>

                            {/* Last Login */}
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center shrink-0">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <span className="font-medium">Last login: 24 May, 2024 10:30 AM</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* MIDDLE COLUMN: Tabs & Form Card (6 cols) */}
                <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-100 shadow-sm p-6 sm:p-7 space-y-6">
                    {/* Navigation Tabs */}
                    <div className="flex items-center gap-4 sm:gap-6 border-b border-slate-100 overflow-x-auto text-xs sm:text-sm font-semibold pb-1">
                        {[
                            { id: "personal", label: "Personal Information" },
                            { id: "company", label: "Company Information" },
                            { id: "preferences", label: "Preferences" },
                            { id: "notifications", label: "Notification Settings" }
                        ].map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`pb-2.5 whitespace-nowrap transition relative ${
                                        isActive
                                            ? "text-violet-600 font-bold"
                                            : "text-slate-500 hover:text-slate-800"
                                    }`}
                                >
                                    {tab.label}
                                    {isActive && (
                                        <span className="absolute bottom-0 left-0 w-full h-[2.5px] bg-violet-600 rounded-full" />
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Form: Personal Information */}
                    {activeTab === "personal" && (
                        <form onSubmit={handleSave} className="space-y-5 animate-in fade-in">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Personal Information</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Update your personal details.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Full Name */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Full Name
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.fullName}
                                        onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 transition"
                                    />
                                </div>

                                {/* Date of Birth */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Date of Birth
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={profile.displayDob}
                                            onChange={(e) => setProfile({ ...profile, displayDob: e.target.value })}
                                            className="w-full px-3.5 py-2.5 pr-9 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 transition"
                                        />
                                        <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Email Address */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        value={profile.email}
                                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 transition"
                                    />
                                </div>

                                {/* Gender */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Gender
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={profile.gender}
                                            onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                                            className="w-full appearance-none px-3.5 py-2.5 pr-9 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 transition cursor-pointer"
                                        >
                                            <option>Female</option>
                                            <option>Male</option>
                                            <option>Non-binary</option>
                                            <option>Prefer not to say</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Phone Number */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Phone Number
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.phone}
                                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 transition"
                                    />
                                </div>

                                {/* Location */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Location
                                    </label>
                                    <input
                                        type="text"
                                        value={profile.location}
                                        onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 transition"
                                    />
                                </div>

                                {/* Job Title */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Job Title
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={profile.jobTitle}
                                            onChange={(e) => setProfile({ ...profile, jobTitle: e.target.value })}
                                            className="w-full appearance-none px-3.5 py-2.5 pr-9 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 transition cursor-pointer"
                                        >
                                            <option>HR Administrator</option>
                                            <option>HR Manager</option>
                                            <option>Talent Acquisition Lead</option>
                                            <option>VP of Human Resources</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                {/* LinkedIn Profile */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        LinkedIn Profile (Optional)
                                    </label>
                                    <div className="relative">
                                        <Linkedin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={profile.linkedin}
                                            onChange={(e) => setProfile({ ...profile, linkedin: e.target.value })}
                                            className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 transition"
                                        />
                                    </div>
                                </div>

                                {/* Department */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Department
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={profile.department}
                                            onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                                            className="w-full appearance-none px-3.5 py-2.5 pr-9 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-violet-500 transition cursor-pointer"
                                        >
                                            <option>Human Resources</option>
                                            <option>Talent Acquisition</option>
                                            <option>People Operations</option>
                                            <option>Executive Management</option>
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Bio (Optional) */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Bio (Optional)
                                    </label>
                                    <textarea
                                        rows="3"
                                        value={profile.bio}
                                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-violet-500 transition resize-none leading-relaxed"
                                    />
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => toast.info("Changes reverted")}
                                    className="px-5 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-violet-500/25 transition active:scale-[0.98]"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Company Information Tab */}
                    {activeTab === "company" && (
                        <div className="space-y-4 animate-in fade-in">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Company Information</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Details about your organization.</p>
                            </div>
                            <div className="space-y-3 text-xs sm:text-sm">
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Company Name</label>
                                    <input
                                        type="text"
                                        value={profile.companyName}
                                        onChange={(e) => setProfile({ ...profile, companyName: e.target.value })}
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Company Website</label>
                                    <input
                                        type="text"
                                        value={profile.companyWebsite}
                                        onChange={(e) => setProfile({ ...profile, companyWebsite: e.target.value })}
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-700 mb-1">Company Size</label>
                                    <input
                                        type="text"
                                        value={profile.companySize}
                                        onChange={(e) => setProfile({ ...profile, companySize: e.target.value })}
                                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-violet-500"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end pt-3 border-t border-slate-100">
                                <button
                                    onClick={handleSave}
                                    className="px-5 py-2 bg-violet-600 text-white rounded-xl text-xs font-semibold"
                                >
                                    Save Company Info
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Preferences Tab */}
                    {activeTab === "preferences" && (
                        <div className="space-y-4 animate-in fade-in text-xs">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Work Preferences</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Customise your HR workspace defaults.</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                                <div className="font-bold text-slate-800">Timezone &amp; Locale</div>
                                <div className="text-slate-600">(GMT+05:30) Asia/Kolkata (IST)</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl space-y-2">
                                <div className="font-bold text-slate-800">Default Currency</div>
                                <div className="text-slate-600">INR (₹) - Indian Rupee</div>
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === "notifications" && (
                        <div className="space-y-4 animate-in fade-in text-xs">
                            <div>
                                <h3 className="text-base font-bold text-slate-900">Notification Settings</h3>
                                <p className="text-xs text-slate-400 mt-0.5">Control communication channels.</p>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { label: "New candidate applications", default: true },
                                    { label: "Interview completion alerts", default: true },
                                    { label: "Daily talent digest", default: false }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl">
                                        <span className="font-medium text-slate-800">{item.label}</span>
                                        <input type="checkbox" defaultChecked={item.default} className="rounded text-violet-600" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT COLUMN: Profile Completion & Overview (3 cols) */}
                <div className="lg:col-span-3 space-y-5">
                    {/* CARD 1: Profile Completion */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4 text-center">
                        <h4 className="text-sm font-bold text-slate-900 text-left">Profile Completion</h4>

                        {/* Circular Progress Meter */}
                        <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                                {/* Background track */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    className="stroke-slate-100"
                                    strokeWidth="8"
                                    fill="none"
                                />
                                {/* Progress arc (85%) */}
                                <circle
                                    cx="50"
                                    cy="50"
                                    r="40"
                                    className="stroke-violet-600"
                                    strokeWidth="8"
                                    strokeDasharray="251.2"
                                    strokeDashoffset="37.68"
                                    strokeLinecap="round"
                                    fill="none"
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-extrabold text-slate-900 leading-none">85%</span>
                                <span className="text-[10px] text-slate-400 font-semibold mt-1">
                                    Profile<br />Completed
                                </span>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500">
                            Complete your profile to get the best experience.
                        </p>

                        {/* Checklist */}
                        <div className="space-y-2 text-left text-xs pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2 text-emerald-600 font-medium">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Personal Information</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600 font-medium">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Company Information</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600 font-medium">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Email Verified</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600 font-medium">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Phone Verified</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-400 font-medium">
                                <Circle className="w-4 h-4 text-slate-300" />
                                <span>Profile Photo</span>
                            </div>
                        </div>
                    </div>

                    {/* CARD 2: HR Overview */}
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-4">
                        <h4 className="text-sm font-bold text-slate-900">HR Overview</h4>

                        <div className="space-y-3.5 text-xs">
                            {/* Jobs Posted */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                                        <Briefcase className="w-4 h-4" />
                                    </div>
                                    <span className="text-slate-600 font-medium">Jobs Posted</span>
                                </div>
                                <span className="font-extrabold text-slate-900 text-sm">12</span>
                            </div>

                            {/* Total Candidates */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <span className="text-slate-600 font-medium">Total Candidates</span>
                                </div>
                                <span className="font-extrabold text-slate-900 text-sm">342</span>
                            </div>

                            {/* Interviews Conducted */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                                        <Video className="w-4 h-4" />
                                    </div>
                                    <span className="text-slate-600 font-medium">Interviews Conducted</span>
                                </div>
                                <span className="font-extrabold text-slate-900 text-sm">28</span>
                            </div>

                            {/* Selected Candidates */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                                        <Award className="w-4 h-4" />
                                    </div>
                                    <span className="text-slate-600 font-medium">Selected Candidates</span>
                                </div>
                                <span className="font-extrabold text-slate-900 text-sm">08</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
