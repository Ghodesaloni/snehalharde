import React from "react";

const AvaHireLogo = ({ size = "md", variant = "dark", className = "" }) => {
    const sizes = {
        xs: { icon: "w-7 h-7 rounded-lg", svg: "w-4 h-4", title: "text-base", sub: "text-[7.5px]" },
        sm: { icon: "w-9 h-9 rounded-xl", svg: "w-5 h-5", title: "text-lg", sub: "text-[8.5px]" },
        md: { icon: "w-11 h-11 rounded-2xl", svg: "w-6 h-6", title: "text-2xl", sub: "text-[10px]" },
        lg: { icon: "w-14 h-14 rounded-2xl", svg: "w-8 h-8", title: "text-3xl", sub: "text-xs" },
    }[size] || { icon: "w-11 h-11 rounded-2xl", svg: "w-6 h-6", title: "text-2xl", sub: "text-[10px]" };

    const isDarkBg = variant === "light" || variant === "darkBg"; // When placed on dark background (white text)
    const titleColor = isDarkBg ? "text-white" : "text-[#0f172a]";
    const hireColor = isDarkBg ? "text-[#a78bfa]" : "text-[#7c3aed]";
    const subColor = isDarkBg ? "text-[#94a3b8]" : "text-[#64748b]";

    return (
        <div className={`flex items-center gap-3 select-none ${className}`} data-testid="avahire-logo">
            {/* Logo Icon with Glowing Violet/Purple Gradient */}
            <div className={`${sizes.icon} bg-gradient-to-b from-[#8B5CF6] via-[#7C3AED] to-[#6D28D9] flex items-center justify-center shadow-lg shadow-violet-600/30 shrink-0 relative overflow-hidden border border-white/10`}>
                {/* Subtle top glare */}
                <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                
                {/* Stylized White Chevron "A" Mark */}
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={`${sizes.svg} text-white relative z-10 drop-shadow-xs`}
                >
                    <path
                        d="M12 4.2L4.2 19.2H8.8L12 12.4L15.2 19.2H19.8L12 4.2Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="0.5"
                        strokeLinejoin="round"
                    />
                </svg>
            </div>

            {/* Wordmark Text */}
            <div className="leading-tight flex flex-col justify-center">
                <div className={`${sizes.title} font-black tracking-tight leading-none ${titleColor} flex items-center`}>
                    <span>Ava</span>
                    <span className={hireColor}>Hire</span>
                </div>
                <div className={`${sizes.sub} uppercase tracking-[0.2em] font-extrabold ${subColor} mt-1 leading-none`}>
                    AI RECRUITMENT SYSTEM
                </div>
            </div>
        </div>
    );
};

export default AvaHireLogo;
