"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import api from "@/utils/api";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Key,
  Lock,
  LogOut,
  Mail,
  User,
} from "lucide-react";

function PasswordToggle({ visible, onClick }) {
  const Icon = visible ? EyeOff : Eye;

  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
      aria-label={visible ? "Hide password" : "Show password"}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  icon: Icon,
  autoComplete,
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5"
      >
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Icon className="h-4 w-4" />
        </div>
        <input
          id={id}
          type={visible ? "text" : "password"}
          required
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          placeholder="Enter password"
          className="block w-full pl-9 pr-10 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white"
        />
        <PasswordToggle visible={visible} onClick={onToggle} />
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const [profile, setProfile] = useState({
    name: "Administrator",
    email: "",
    role: "Admin",
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);
  const [errorPass, setErrorPass] = useState("");
  const [toastMessage, setToastMessage] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem("user");
    console.log("user profile", session)

    if (!session) return;

    try {
      const parsed = JSON.parse(session);

      const storedRole = parsed.role;
      
      const loadedProfile = {
        name:
          [parsed.first_name, parsed.last_name].filter(Boolean).join(" "),
        email: parsed.email ,
       
        role: storedRole,
      };

      queueMicrotask(() => {
        setProfile(loadedProfile);
      });
    } catch {
      localStorage.removeItem("user");
      router.push("/");
    }
  }, [router]);

  useEffect(() => {
    if (!toastMessage) return;

    const timeout = setTimeout(() => {
      setToastMessage(null);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [toastMessage]);

  const resetPasswordFields = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const getInitials = () => {
    return (
      profile.name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase() || "A"
    );
  };

  const isStrongPassword = (password) => {
    return (
      password.length >= 8 &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password) &&
      /[0-9]/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorPass("");
    setLoadingPass(true);


    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorPass("Old password and new password are required.");
      setLoadingPass(false);
      return;
    }
    console.log("currentpassword" , currentPassword)
    if (currentPassword === newPassword) {
      setErrorPass("New password must be different from old password.");
      setLoadingPass(false);
      return;
    }

    if (!isStrongPassword(newPassword)) {
      setErrorPass("New password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
      setLoadingPass(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorPass("Passwords do not match.");
      setLoadingPass(false);
      return;
    }

    try {
      const { data } = await api.patch("/admin/change-password", {
        old_password: currentPassword,
        new_password: newPassword,
      });

      if (data?.status === false) {
        throw new Error(data.message || "Failed to modify password.");
      }

      setToastMessage(data?.message || "Password changed successfully.");
      resetPasswordFields();
    } catch (err) {
      setErrorPass(
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        "Failed to modify password.",
      );
    } finally {
      setLoadingPass(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      localStorage.removeItem("accesstoken");
      localStorage.removeItem("refreshtoken");
      localStorage.removeItem("user");
      router.push("/");
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold"
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-outfit">
          Admin Panel Settings
        </h2>
        <p className="text-sm text-slate-500">
          Review administrator identity, update security credentials, and manage the active session.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
            <div className="bg-slate-900 px-6 py-5 text-white">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-primary/20 border border-white/10 flex items-center justify-center text-xl font-bold shrink-0">
                  {getInitials()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold font-outfit text-base truncate">
                    {profile.name || "Administrator"}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 truncate">
                    {profile.role || "Admin"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200/70 rounded-xl">
                <User className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    Display name
                  </span>
                  <span className="block text-sm font-semibold text-slate-800 truncate">
                    {profile.name || "Administrator"}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200/70 rounded-xl">
                <Mail className="h-4.5 w-4.5 text-primary shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    Authorized email
                  </span>
                  <span className="block text-sm font-semibold text-slate-800 truncate">
                    {profile.email || "Not available"}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-4">
                  <span className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    Access level
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-slate-800">
                    {profile.role || "Admin"}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-200/70 bg-slate-50 p-4">
                  <span className="block text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    Account
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-slate-800">
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <LogOut className="h-4.5 w-4.5 text-rose-500 shrink-0" />
              <h3 className="font-bold text-slate-800 font-outfit text-sm">
                Security Actions
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sign out from this device and clear saved access credentials.
            </p>
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full py-3 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none"
            >
              <LogOut className="h-4 w-4" />
              Terminate and Sign Out
            </button>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
              <Lock className="h-4.5 w-4.5 text-primary shrink-0" />
              <h3 className="font-bold text-slate-800 font-outfit text-sm">
                Change Security Password
              </h3>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <PasswordInput
                id="current-password"
                label="Old Password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                visible={showCurrentPassword}
                onToggle={() => setShowCurrentPassword((value) => !value)}
                icon={Key}
                autoComplete="current-password"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PasswordInput
                  id="new-password"
                  label="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  visible={showNewPassword}
                  onToggle={() => setShowNewPassword((value) => !value)}
                  icon={Lock}
                  autoComplete="new-password"
                />

                <PasswordInput
                  id="confirm-password"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  visible={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword((value) => !value)}
                  icon={Lock}
                  autoComplete="new-password"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  New password must be different from old password and include uppercase, lowercase, number, and special character.
                </p>
              </div>

              {errorPass && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
                  <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                  <span>{errorPass}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loadingPass}
                className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none disabled:opacity-60"
              >
                {loadingPass ? (
                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                ) : (
                  "Update Password"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowLogoutConfirm(false)}
              className="fixed inset-0 bg-slate-950"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 shadow-2xl z-10 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-rose-500" />

              <h3 className="text-lg font-bold text-slate-800 font-outfit mb-2">
                Are you sure you want to sign out?
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                You will lose active session credentials and will be redirected back to the secure login portal.
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer focus:outline-none"
                >
                  Cancel and Stay
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-xs font-semibold bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-md transition-all cursor-pointer focus:outline-none"
                >
                  Confirm Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
