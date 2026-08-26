import React from "react";
import { Link } from "react-router-dom";
import AvaHireLogo from "./AvaHireLogo";

const Footer = () => {
    return (
        <footer className="bg-slate-950 text-slate-300 mt-24" data-testid="public-footer">
            <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 grid grid-cols-2 md:grid-cols-4 gap-10">
                <div className="col-span-2 md:col-span-1">
                    <AvaHireLogo variant="light" />
                    <p className="text-sm text-slate-400 mt-5 max-w-xs leading-relaxed">
                        AI-powered recruitment platform helping HR teams hire smarter, faster and fairer.
                    </p>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-4">Product</h4>
                    <ul className="space-y-2.5 text-sm">
                        <li><Link to="/features" className="hover:text-violet-400">Features</Link></li>
                        <li><Link to="/how-it-works" className="hover:text-violet-400">How It Works</Link></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-4">Company</h4>
                    <ul className="space-y-2.5 text-sm">
                        <li><Link to="/about" className="hover:text-violet-400">About Us</Link></li>
                        <li><Link to="/contact" className="hover:text-violet-400">Contact</Link></li>
                        <li><a href="#" className="hover:text-violet-400">Careers</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="text-white font-semibold mb-4">Get in touch</h4>
                    <ul className="space-y-2.5 text-sm text-slate-400">
                        <li><i className="fa-regular fa-envelope mr-2 text-violet-400"></i>hello@avahire.ai</li>
                        <li><i className="fa-solid fa-phone mr-2 text-violet-400"></i>+91 </li>
                        <li className="flex gap-3 pt-2">
                            <a href="#" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-violet-600 flex items-center justify-center transition"><i className="fa-brands fa-linkedin-in"></i></a>
                            <a href="#" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-violet-600 flex items-center justify-center transition"><i className="fa-brands fa-x-twitter"></i></a>
                            <a href="#" className="w-9 h-9 rounded-full bg-slate-800 hover:bg-violet-600 flex items-center justify-center transition"><i className="fa-brands fa-instagram"></i></a>
                        </li>
                    </ul>
                </div>
            </div>
            <div className="border-t border-slate-800/70 py-6 text-center text-sm text-slate-500">
                {new Date().getFullYear()} AvaHire. All rights reserved.
            </div>
        </footer>
    );
};

export default Footer;
