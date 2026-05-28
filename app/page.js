"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import api, { apiUrl } from "@/utils/api";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import {
  Lock,
  Mail,
  Key,
  ArrowLeft,
  Activity,
  CheckCircle2,
  Eye,
  EyeOff,
  AlertCircle,
  ClipboardCheck,
} from "lucide-react";

const readAccessToken = (payload) => {
  return (
    payload?.data?.accessToken ||
    payload?.data?.access_token ||
    payload?.data?.token ||
    payload?.accessToken ||
    payload?.access_token ||
    payload?.token ||
    null
  );
};

const readRefreshToken = (payload) => {
  return (
    payload?.data?.refreshToken ||
    payload?.data?.refresh_token ||
    payload?.refreshToken ||
    payload?.refresh_token ||
    null
  );
};

const readUser = (payload) => {
  return payload?.data?.user || payload?.user || null;
};

export default function LoginPage() {
  const router = useRouter();
  const { primaryColor } = useTheme();

  // Authentication & Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  // Flow State: 'login' | 'forgot_email' | 'forgot_otp' | 'forgot_reset' | 'forgot_success'
  const [flow, setFlow] = useState("login");

  // Forgot Password Recovery States
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otpTimer, setOtpTimer] = useState(0);
  const [resendingOtp, setResendingOtp] = useState(false);

  // Clear states when switching flow
  const switchFlow = (newFlow) => {
    setError("");
    setSuccess("");
    setFlow(newFlow);
  };

  useEffect(() => {
    let active = true;

    const validateSession = async () => {
      const accessToken = localStorage.getItem("accesstoken");
      if (!accessToken) {
        setCheckingSession(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        if (!active) return;

        if (data?.status === false) {
          throw new Error(data.message || "Session expired");
        }

        if (data?.data) {
          localStorage.setItem("user", JSON.stringify(data.data));
        }
        router.replace("/dashboard");
      } catch {
        localStorage.removeItem("accesstoken");
        localStorage.removeItem("refreshtoken");
        localStorage.removeItem("user");
        localStorage.removeItem("aurahealth_session");
        if (active) setCheckingSession(false);
      }
    };

    validateSession();

    return () => {
      active = false;
    };
  }, [router]);

  // OTP Timer countdown simulator
  useEffect(() => {
    let interval;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Handler for Core Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    // Simple validation
    if (!email || !password) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(apiUrl("/auth/login"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Login failed.");
      }

      const accessToken = readAccessToken(data);
      const refreshToken = readRefreshToken(data);
      const user = readUser(data);

      if (!accessToken || !refreshToken || !user) {
        throw new Error("Login response is missing session data.");
      }

      localStorage.setItem("accesstoken", accessToken);
      localStorage.setItem("refreshtoken", refreshToken);
      localStorage.setItem("user", JSON.stringify(user));
      console.log(user);
      setSuccess("Login successful");

      setTimeout(() => {
        router.replace("/dashboard");
      }, 1000);

    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const requestOtp = async ({ moveToOtpStep = false, resend = false } = {}) => {
    setError("");
    setSuccess("");
    if (resend) {
      setResendingOtp(true);
    } else {
      setLoading(true);
    }

    if (!recoveryEmail) {
      setError("Please enter a valid email address.");
      setLoading(false);
      setResendingOtp(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recoveryEmail)) {
      setError("Please enter a valid email address format.");
      setLoading(false);
      setResendingOtp(false);
      return;
    }

    try {
      const res = await fetch(
        apiUrl("/auth/forgot-password"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: recoveryEmail }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message);
      }

      setSuccess(data.message || (resend ? "OTP resent successfully." : "OTP sent successfully."));

      setOtpTimer(60);

      if (moveToOtpStep) {
        setTimeout(() => {
          switchFlow("forgot_otp");
        }, 1000);
      }
    } catch (err) {
      setError(err.message || "Failed to request OTP. Try again.");
    } finally {
      setLoading(false);
      setResendingOtp(false);
    }
  };

  // Handler for Requesting Forgot Password OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    await requestOtp({ moveToOtpStep: true });
  };

  // Handler for Verifying OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!otpCode || otpCode.length !== 6) {
      setError("Please enter a 6-digit OTP code.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        apiUrl("/auth/verify-otp"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: recoveryEmail, otp: otpCode }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "OTP verification failed.");
      }

      setSuccess(data.message || "OTP verified successfully!");
      setTimeout(() => {
        switchFlow("forgot_reset");
      }, 1000);
    } catch (err) {
      setError(err.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  };

  // Handler for Saving New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!newPassword || !confirmPassword) {
      setError("Please fill in both password fields.");
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        apiUrl("/auth/reset-password"),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: recoveryEmail,
            new_password: newPassword,
          }),
        },
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Password reset failed.");
      }
      setSuccess(
        data.message || "Your password has been successfully updated!",
      );
      setTimeout(() => {
        switchFlow("forgot_success");
      }, 1000);
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-slate-900 px-4 sm:px-6 lg:px-8">
      {/* Background abstract glowing circles */}
      <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

      {/* Main card box container */}
      <div className="w-full max-w-md z-10">
        {/* Title logo and header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-2xl mb-3 shadow-glow transition-all duration-500">
            <Image
              src="/image_44ed8e77-Photoroom.png"
              loading="eager"
              alt="ADIXON Logo"
              width={200}
              height={200}
              className="h-12 w-40 rounded-sm "
            />
          </div>
         
          <p className="mt-1.5 text-sm text-slate-400">
            Clinical Operations & Staff Panel
          </p>
        </div>

        <div className="dark-glass-card rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          {/* Neon side borders */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80" />

          <AnimatePresence mode="wait">
            {/* 1. Core Login Flow */}
            {flow === "login" && (
              <motion.div
                key="login-form"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white font-outfit">
                    Welcome Back
                  </h3>
                  <p className="text-sm text-slate-400">
                    Sign in to manage clinical workflows
                  </p>
                </div>

                <form onSubmit={handleLoginSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="doctor@aurahealth.com"
                        className="block w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-light"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                        Security Password
                      </label>
                      <button
                        type="button"
                        onClick={() => switchFlow("forgot_email")}
                        className="text-xs font-medium text-primary hover:text-primary-hover transition-colors focus:outline-none"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="block w-full pl-10 pr-11 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-light"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4.5 w-4.5" />
                        ) : (
                          <Eye className="h-4.5 w-4.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Feedback Blocks */}
                  {error && (
                    <div className="flex items-start gap-2.5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs leading-5">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="flex items-start gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs leading-5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{success}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Sign In securely"
                    )}
                  </button>

                  <div className="text-center mt-6 text-xs text-slate-500">
                    Clinic authorization required. Access logged and secured.
                  </div>
                </form>
              </motion.div>
            )}

            {/* 2. Forgot Password - Enter Email */}
            {flow === "forgot_email" && (
              <motion.div
                key="forgot-email"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <button
                    onClick={() => switchFlow("login")}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-3 focus:outline-none"
                  >
                    <ArrowLeft className="h-3 w-3" /> Back to Login
                  </button>
                  <h3 className="text-xl font-bold text-white font-outfit">
                    Reset Password
                  </h3>
                  <p className="text-sm text-slate-400">
                    Enter your registered email address to verify identity
                  </p>
                </div>

                <form onSubmit={handleRequestOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Registered Email
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Mail className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        required
                        value={recoveryEmail}
                        onChange={(e) => setRecoveryEmail(e.target.value)}
                        placeholder="doctor@aurahealth.com"
                        className="block w-full pl-10 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-light"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs leading-5">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="flex items-start gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs leading-5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{success}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium shadow-lg transition-all focus:outline-none text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Send Verification OTP"
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* 3. Forgot Password - Enter OTP */}
            {flow === "forgot_otp" && (
              <motion.div
                key="forgot-otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <button
                    onClick={() => switchFlow("forgot_email")}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-3 focus:outline-none"
                  >
                    <ArrowLeft className="h-3 w-3" /> Back
                  </button>
                  <h3 className="text-xl font-bold text-white font-outfit">
                    OTP Verification
                  </h3>
                  <p className="text-sm text-slate-400">
                    We sent a secure code to{" "}
                    <span className="text-white font-medium">
                      {recoveryEmail}
                    </span>
                  </p>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Enter 6-Digit Code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Key className="h-4 w-4" />
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        required
                        value={otpCode}
                        onChange={(e) =>
                          setOtpCode(e.target.value.replace(/\D/g, ""))
                        }
                        placeholder="••••••"
                        className="block w-full tracking-[1.5em] text-center pl-6 pr-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-base font-bold"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs leading-5">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="flex items-start gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs leading-5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{success}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium shadow-lg transition-all focus:outline-none text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Verify Security Code"
                    )}
                  </button>

                  <div className="text-center mt-3">
                    <button
                      type="button"
                      disabled={otpTimer > 0 || resendingOtp}
                      onClick={() => requestOtp({ resend: true })}
                      className="text-xs text-slate-400 hover:text-white transition-colors focus:outline-none disabled:opacity-50 disabled:hover:text-slate-400"
                    >
                      {resendingOtp
                        ? "Sending OTP..."
                        : otpTimer > 0
                        ? `Resend Code in ${otpTimer}s`
                        : "Resend Verification Code"}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* 4. Forgot Password - Set New Password */}
            {flow === "forgot_reset" && (
              <motion.div
                key="forgot-reset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-white font-outfit">
                    Create New Password
                  </h3>
                  <p className="text-sm text-slate-400">
                    Establish a secure and strong password credentials
                  </p>
                </div>

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      New Security Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="block w-full pl-10 pr-11 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-light"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-4.5 w-4.5" />
                        ) : (
                          <Eye className="h-4.5 w-4.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="h-4 w-4" />
                      </div>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="block w-full pl-10 pr-11 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm font-light"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="flex items-start gap-2.5 p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs leading-5">
                      <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="flex items-start gap-2.5 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs leading-5">
                      <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>{success}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium shadow-lg transition-all focus:outline-none text-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      "Update Credentials"
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* 5. Forgot Password - Success Screen */}
            {flow === "forgot_success" && (
              <motion.div
                key="forgot-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="text-center py-4"
              >
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                  <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white font-outfit mb-2">
                  Password Updated!
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  Your credentials have been successfully updated. You can now
                  log in securely using your new password.
                </p>
                <button
                  onClick={() => switchFlow("login")}
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl font-medium shadow-lg transition-all focus:outline-none text-sm cursor-pointer"
                >
                  Proceed to Login
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
