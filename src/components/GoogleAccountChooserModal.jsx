import React, { useState, useEffect } from "react";
import {
  X,
  UserPlus,
  ArrowLeft,
  Check,
  Loader2,
  Mail,
  User,
  Shield,
  Trash2,
} from "lucide-react";

// Google multi-colored G logo SVG
export const GoogleLogoSvg = ({ size = 22, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    aria-hidden="true"
  >
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
    />
  </svg>
);

const DEFAULT_ACCOUNTS = [
  {
    id: "acc_1",
    email: "salonighode3@gmail.com",
    name: "Saloni Ghode",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
    color: "bg-purple-600",
    isDefault: true,
  },
  {
    id: "acc_2",
    email: "saloni.work@gmail.com",
    name: "Saloni Ghode (Work)",
    avatar: "",
    color: "bg-emerald-600",
    isDefault: true,
  },
];

const GoogleAccountChooserModal = ({
  isOpen,
  onClose,
  onSelectAccount,
  mode = "register", // "register" or "login"
  initialEmail = "",
  initialName = "",
}) => {
  const [view, setView] = useState("choose"); // "choose" or "add"
  const [accounts, setAccounts] = useState(DEFAULT_ACCOUNTS);
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Add Account form state
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");

  // Load saved accounts from localStorage on open
  useEffect(() => {
    if (!isOpen) {
      setView("choose");
      setSelectedAccountId(null);
      setError("");
      setNewEmail("");
      setNewName("");
      return;
    }

    try {
      const stored = localStorage.getItem("avahire_google_accounts");
      let list = DEFAULT_ACCOUNTS;
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Merge unique by email
          const emailMap = new Map();
          [...DEFAULT_ACCOUNTS, ...parsed].forEach((a) => {
            if (a.email) emailMap.set(a.email.toLowerCase(), a);
          });
          list = Array.from(emailMap.values());
        }
      }

      // If initialEmail was passed and not in list, prefill add view or add as suggestion
      if (initialEmail && initialEmail.includes("@")) {
        const exists = list.some(
          (a) => a.email.toLowerCase() === initialEmail.toLowerCase()
        );
        if (!exists) {
          list = [
            ...list,
            {
              id: `acc_init_${Date.now()}`,
              email: initialEmail,
              name: initialName || initialEmail.split("@")[0],
              color: "bg-blue-600",
            },
          ];
        }
      }

      setAccounts(list);
    } catch {
      setAccounts(DEFAULT_ACCOUNTS);
    }
  }, [isOpen, initialEmail, initialName]);

  if (!isOpen) return null;

  const handleSelectAccount = async (account) => {
    setSelectedAccountId(account.id);
    setIsProcessing(true);
    setError("");

    try {
      await onSelectAccount({
        email: account.email,
        name: account.name,
        avatar: account.avatar || "",
      });
      // Save accounts list
      localStorage.setItem("avahire_google_accounts", JSON.stringify(accounts));
    } catch (err) {
      console.error("Account selection failed:", err);
      setError(err?.message || "Failed to authenticate with this Google account.");
      setIsProcessing(false);
    }
  };

  const handleAddAccountSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const cleanEmail = newEmail.trim().toLowerCase();
    if (!cleanEmail) {
      setError("Please enter your Google email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError("Please enter a valid email address (e.g. name@gmail.com).");
      return;
    }

    const cleanName =
      newName.trim() ||
      cleanEmail
        .split("@")[0]
        .replace(/[._]/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());

    const newAcc = {
      id: `acc_${Date.now()}`,
      email: cleanEmail,
      name: cleanName,
      color: "bg-indigo-600",
      avatar: "",
    };

    const updatedAccounts = [
      newAcc,
      ...accounts.filter((a) => a.email.toLowerCase() !== cleanEmail),
    ];
    setAccounts(updatedAccounts);
    localStorage.setItem(
      "avahire_google_accounts",
      JSON.stringify(updatedAccounts)
    );

    await handleSelectAccount(newAcc);
  };

  const handleRemoveAccount = (e, accId) => {
    e.stopPropagation();
    const updated = accounts.filter((a) => a.id !== accId);
    setAccounts(updated);
    localStorage.setItem("avahire_google_accounts", JSON.stringify(updated));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
      data-testid="google-account-chooser-modal"
    >
      <div
        className="w-full max-w-[460px] bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Loading Progress Bar */}
        {isProcessing && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-violet-100 overflow-hidden z-20">
            <div className="w-1/2 h-full bg-blue-600 animate-pulse transition-all duration-300"></div>
          </div>
        )}

        {/* Modal Header */}
        <div className="px-8 pt-8 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <GoogleLogoSvg size={24} />
              <span className="text-sm font-semibold tracking-tight text-slate-700">
                Google
              </span>
            </div>

            <button
              type="button"
              disabled={isProcessing}
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {view === "choose" ? (
            <div className="mt-5 text-left">
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                Choose an account
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                to {mode === "register" ? "register and create account at" : "sign in to"}{" "}
                <span className="font-semibold text-slate-800">AvaHire AI</span>
              </p>
            </div>
          ) : (
            <div className="mt-5 text-left">
              <button
                type="button"
                onClick={() => {
                  setView("choose");
                  setError("");
                }}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 mb-2 transition"
              >
                <ArrowLeft size={14} />
                <span>All accounts</span>
              </button>
              <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                Add Google Account
              </h3>
              <p className="text-slate-500 text-sm mt-1">
                Enter your Google account email to continue
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mx-8 mb-3 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        {/* Body Views */}
        {view === "choose" ? (
          <div className="px-6 pb-6">
            <div className="divide-y divide-slate-100 border-y border-slate-100 max-h-[300px] overflow-y-auto">
              {accounts.map((acc) => {
                const isSelected = selectedAccountId === acc.id;
                const initialLetter = (acc.name || acc.email)[0].toUpperCase();

                return (
                  <div
                    key={acc.id}
                    onClick={() => !isProcessing && handleSelectAccount(acc)}
                    data-testid={`google-acc-item-${acc.email}`}
                    className={`flex items-center justify-between p-3.5 rounded-xl transition cursor-pointer group ${
                      isSelected
                        ? "bg-blue-50/70 text-blue-900"
                        : "hover:bg-slate-50 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {acc.avatar ? (
                        <img
                          src={acc.avatar}
                          alt={acc.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0 shadow-xs ${
                            acc.color || "bg-violet-600"
                          }`}
                        >
                          {initialLetter}
                        </div>
                      )}
                      <div className="min-w-0 text-left">
                        <div className="text-sm font-semibold text-slate-900 truncate flex items-center gap-2">
                          <span>{acc.name}</span>
                          {acc.isDefault && (
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-normal">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 truncate font-mono">
                          {acc.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {isProcessing && isSelected ? (
                        <Loader2
                          size={18}
                          className="animate-spin text-blue-600"
                        />
                      ) : isSelected ? (
                        <Check size={18} className="text-blue-600" />
                      ) : (
                        !acc.isDefault && (
                          <button
                            type="button"
                            onClick={(e) => handleRemoveAccount(e, acc.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-rose-500 rounded-lg transition"
                            title="Remove from this device"
                          >
                            <Trash2 size={14} />
                          </button>
                        )
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Add / Use Another Account Option */}
              <div
                onClick={() => {
                  setView("add");
                  setError("");
                }}
                data-testid="google-use-another-account"
                className="flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-slate-50 transition cursor-pointer text-slate-700 hover:text-slate-900"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                  <UserPlus size={18} />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-800">
                    Use another account
                  </div>
                  <div className="text-xs text-slate-500">
                    Add any other Google or Workspace account
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-left px-2">
              <p className="text-[11px] text-slate-500 leading-relaxed">
                To continue, Google will share your name, email address, language preference, and profile picture with AvaHire. Review AvaHire’s{" "}
                <span className="text-blue-600 hover:underline cursor-pointer">
                  Privacy Policy
                </span>{" "}
                and{" "}
                <span className="text-blue-600 hover:underline cursor-pointer">
                  Terms of Service
                </span>
                .
              </p>
            </div>
          </div>
        ) : (
          /* ADD ACCOUNT FORM VIEW */
          <div className="px-8 pb-8">
            <form onSubmit={handleAddAccountSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Google Email Address
                </label>
                <div className="relative">
                  <Mail
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    required
                    data-testid="google-add-email-input"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Full Name (Optional)
                </label>
                <div className="relative">
                  <User
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="text"
                    data-testid="google-add-name-input"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Saloni Ghode"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setView("choose")}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isProcessing}
                  data-testid="google-add-submit"
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-600/20 flex items-center gap-2 transition cursor-pointer disabled:opacity-60"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Connecting...</span>
                    </>
                  ) : (
                    <span>Continue with Google</span>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
              <Shield size={14} className="text-slate-400 shrink-0" />
              <span>
                Protected by Google Accounts OAuth 2.0 Security Standards
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleAccountChooserModal;
