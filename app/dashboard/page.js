"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import {
  Users,
  UserSquare2,
  Stethoscope,
  Clock,
  UserCheck2,
  UserX,
  ArrowRight,
  TrendingUp,
  CheckCircle,
  XCircle,
  FileCheck,
  AlertCircle,
  Plus,
  Droplet,
  Building,
  Heart,
  Activity,
  PlusCircle,
  Trash2,
} from "lucide-react";

export default function HomeDashboard() {
  const router = useRouter();
  // 1. Dynamic Counts States
  const [totalDoctors, setTotalDoctors] = useState(null);
  const [totalRooms, setTotalRooms] = useState(null);
  const [totalStaff, setTotalStaff] = useState(null);
  const [totalPatients, setTotalPatients] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingUsers, setpendinguser] = useState([]);
  const [approvedUsers, setapprovedUsers] = useState([]);
  const [rejectedUsers, setrejectedUsers] = useState([]);
  const [confirmedRoles, setConfirmedRoles] = useState({});
  const [roleModal, setRoleModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get("/admin/dashboard");
      setTotalDoctors(data?.data?.users?.total_doctors || 0);
      setTotalRooms(data?.data?.users?.pending_approvals || 0);
      setTotalStaff(data?.data?.users?.total_staff || 0);
      setTotalPatients(data?.data?.patients?.total || 0);
    } catch (error) {
      console.log("ERROR =>", error);
    }
  };

const loadusers = async () => {
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data.data);
    } catch (error) {
      console.error("Error fetching users data:", error);
    }
  };
  

  const fetchpending = async () => {
    try {
      const { data } = await api.get("/admin/users", { params: { status: "pending" } });
      setpendinguser(data.data);
    } catch (error) {
      console.error("Error fetching users data:", error);
    }
  };
  const fetchapproved = async () => {
    try {
      const { data } = await api.get("/admin/users", { params: { status: "approved" } });
      setapprovedUsers(data.data);
    } catch (error) {
      console.error("Error fetching users data:", error);
    }
  };

  const fetchrejected = async () => {
    try {
      const { data } = await api.get("/admin/users", { params: { status: "rejected" } });
      setrejectedUsers(data.data);
    } catch (error) {
      console.error("Error fetching users data:", error);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchDashboard();
      fetchpending();
      fetchapproved();
      fetchrejected();
      loadusers();
    });
  }, []);

  const [activeTab, setActiveTab] = useState("pending");
  const [toastMessage, setToastMessage] = useState(null);

  // Trigger brief floating toast notifications
  const triggerToast = (msg, type = "success") => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const refreshDashboardData = async () => {
    await Promise.all([
      fetchpending(),
      fetchapproved(),
      fetchrejected(),
      fetchDashboard(),
      loadusers(),
    ]);
  };

  const getUserDisplayName = (user) => {
    return (
      user?.name ||
      `${user?.first_name || ""} ${user?.last_name || ""}`.trim() ||
      "User"
    );
  };

  const updateUserRole = async (user, role) => {
    if ((user.role || "").toLowerCase() === role.toLowerCase()) {
      return user.user_code;
    }

    const { data } = await api.patch(`/admin/users/${user.user_code}/role`, { role });

    if (data.status === false) {
      throw new Error(data.message || "Role update failed");
    }

    return data?.data?.new_user_code || user.user_code;
  };

  const runUserDecision = async (user, decision, userCode, role) => {
    setActionLoading(`${decision}-${user.user_code}`);

    try {
      const endpoint = decision === "approve" ? "approve" : "reject";

      const { data } = await api.patch(`/admin/${endpoint}/${userCode}`);

      if (data.status !== false) {
        await refreshDashboardData();
        setConfirmedRoles((current) => {
          const next = { ...current };
          delete next[user.user_code];
          return next;
        });

        triggerToast(
          `${getUserDisplayName(user)} ${decision === "approve" ? "approved" : "rejected"} as ${role}`,
          decision === "approve" ? "success" : "error",
        );
      } else {
        triggerToast(data.message || `${decision} failed`, "error");
      }
    } catch (error) {
      console.error(`Error during ${decision}:`, error);
      triggerToast(error.message || "Something went wrong", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const openRoleModal = (user, decision = null) => {
    const confirmedRole = confirmedRoles[user.user_code]?.role;
    const currentRole = ["Doctor", "Staff"].includes(user.role) ? user.role : "";

    setRoleModal({
      user,
      decision,
      role: confirmedRole || currentRole || "",
    });
  };

  const handleUserDecision = async (user, decision) => {
    const confirmed = confirmedRoles[user.user_code];

    if (!confirmed) {
      openRoleModal(user, decision);
      return;
    }

    await runUserDecision(user, decision, confirmed.userCode, confirmed.role);
  };

  const handleConfirmRole = async () => {
    if (!roleModal?.user || !roleModal.role) {
      triggerToast("Please select Doctor or Staff role.", "error");
      return;
    }

    const { user, role, decision } = roleModal;
    setActionLoading(`role-${user.user_code}`);

    try {
      const confirmedUserCode = await updateUserRole(user, role);

      setConfirmedRoles((current) => ({
        ...current,
        [user.user_code]: {
          role,
          userCode: confirmedUserCode,
        },
      }));

      setRoleModal(null);
      await refreshDashboardData();
      triggerToast(`${getUserDisplayName(user)} role confirmed as ${role}`);

      if (decision) {
        await runUserDecision(user, decision, confirmedUserCode, role);
      }
    } catch (error) {
      triggerToast(error.message || "Role confirmation failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectExistingUser = async (user) => {
    setActionLoading(`reject-${user.user_code}`);

    try {
      const { data } = await api.patch(`/admin/reject/${user.user_code}`);

      if (data.status !== false) {
        await refreshDashboardData();
        triggerToast(`${getUserDisplayName(user)} rejected successfully`, "error");
      } else {
        triggerToast(data.message || "Reject failed", "error");
      }
    } catch (error) {
      triggerToast(error.message || "Something went wrong", "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter users lists based on active tabs

  return (
    <div className="space-y-6">
      {/* Dynamic Action Toast Alert */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl flex items-center gap-3 border text-sm font-medium ${
              toastMessage.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : toastMessage.type === "error"
                  ? "bg-rose-50 border-rose-200 text-rose-800"
                  : "bg-blue-50 border-blue-200 text-blue-800"
            }`}
          >
            {toastMessage.type === "success" && (
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            )}
            {toastMessage.type === "error" && (
              <XCircle className="h-5 w-5 text-rose-600" />
            )}
            {toastMessage.type === "info" && (
              <AlertCircle className="h-5 w-5 text-blue-600" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header Overview Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-outfit">
            Admin Dashboard
          </h2>
         
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/create-certificate")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/15 hover:bg-primary-hover focus:outline-none"
        >
          <PlusCircle className="h-4 w-4" />
          Create Template
        </button>
      </div>

      {/* 2. Dynamic Count Stat Panels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Doctors */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-16 w-16 bg-primary/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Doctors
            </span>
            <div className="p-2 bg-primary/10 rounded-xl text-primary">
              <Stethoscope className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800 tracking-tight">
              {totalDoctors}
            </span>
          </div>
         
        </div>

        {/* Card 2: Consultation Rooms */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-16 w-16 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Satff
            </span>
            <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500">
              <Building className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800 tracking-tight">
              {totalStaff}
            </span>
          </div>
        </div>

        {/* Card 3: Active Support Staff */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-16 w-16 bg-blue-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending Approvals
            </span>
            <div className="p-2 bg-blue-500/10 rounded-xl text-blue-500">
              <UserSquare2 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800 tracking-tight">
              {totalRooms}
            </span>
            
          </div>
          
        </div>

        {/* Card 4: Pending Authorizations */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-16 w-16 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition-transform" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Patients
            </span>
            <div className="p-2 bg-amber-500/10 rounded-xl text-amber-500">
              <Clock className="h-5 w-5 animate-pulse" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800 tracking-tight">
              {totalPatients}
            </span>
          </div>
        </div>
      </div>

      {/* 3. User Onboarding Control Panel (Tabs & Tables) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Header Tab togglers */}
        <div className="px-6 py-4 border-b border-slate-200/60 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-slate-500" />
            <h3 className="font-bold text-slate-800 font-outfit">
              Credentials Audit Control
            </h3>
          </div>

          <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl self-start sm:self-auto">
            {/* Pending Tab */}
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all focus:outline-none cursor-pointer flex items-center gap-1.5 ${
                activeTab === "pending"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Pending</span>
              {pendingUsers.length > 0 && (
                <span className="h-5 min-w-[20px] px-1 bg-amber-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                  {pendingUsers.length}
                </span>
              )}
            </button>

            {/* Approved Tab */}
            <button
              onClick={() => setActiveTab("approved")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all focus:outline-none cursor-pointer flex items-center gap-1.5 ${
                activeTab === "approved"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Approved</span>
              <span className="h-5 min-w-[20px] px-1 bg-slate-300 text-slate-700 rounded-full text-[10px] flex items-center justify-center font-semibold">
                {approvedUsers.length}
              </span>
            </button>

            {/* Rejected Tab */}
            <button
              onClick={() => setActiveTab("rejected")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all focus:outline-none cursor-pointer flex items-center gap-1.5 ${
                activeTab === "rejected"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <span>Rejected</span>
              <span className="h-5 min-w-[20px] px-1 bg-slate-300 text-slate-700 rounded-full text-[10px] flex items-center justify-center font-semibold">
                {rejectedUsers.length}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Workspaces */}
        <div className="p-6 overflow-x-auto">
          <AnimatePresence mode="wait">
            {/* Tab: PENDING */}
            {activeTab === "pending" && (
              <motion.div
                key="pending-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {pendingUsers.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl">
                    <UserCheck2 className="h-10 w-10 text-slate-300 mb-3" />
                    <h4 className="text-sm font-semibold text-slate-700">
                      No Pending Applications
                    </h4>
                    <p className="text-xs text-slate-400 font-light mt-1">
                      All applicant submissions have been evaluated
                      successfully.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3">
                        <th className="pb-3.5 font-semibold">Applicant Info</th>
                        <th className="pb-3.5 font-semibold"> Role</th>

                        <th className="pb-3.5 font-semibold">Applied Date</th>
                        <th className="pb-3.5 font-semibold text-right">
                          Actions Panel
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {pendingUsers.map((user,inx) => {
                        const confirmedRole = confirmedRoles[user.user_code]?.role;
                        const isApproveLoading = actionLoading === `approve-${user.user_code}`;
                        const isRejectLoading = actionLoading === `reject-${user.user_code}`;

                        return (
                        <tr
                          key={inx}
                          className="group hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-700">
                                {user.name}
                              </span>
                              <span className="text-xs text-slate-400 font-light">
                                {user.email}
                              </span>
                            </div>
                          </td>
                          <td className="py-4">
                            <div className="flex flex-col gap-1.5">
                              <button
                                onClick={() => openRoleModal(user)}
                                disabled={Boolean(actionLoading)}
                                className={`w-40 rounded-lg border px-3 py-2 text-xs font-semibold shadow-sm transition-all focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
                                  confirmedRole
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                                }`}
                              >
                                {confirmedRole ? `Confirmed: ${confirmedRole}` : "Confirm role"}
                              </button>
                              <span className="text-[10px] text-slate-400">
                                Current: {user.role || "Staff"}
                              </span>
                            </div>
                          </td>

                          <td className="py-4 text-xs text-slate-500">
                            {user.created_at.split("T")[0]}
                          </td>
                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              <button
                                onClick={() => handleUserDecision(user, "reject")}
                                disabled={Boolean(actionLoading)}
                                className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold cursor-pointer transition-all focus:outline-none flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {isRejectLoading ? (
                                  <span className="h-3.5 w-3.5 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
                                ) : (
                                  <UserX className="h-3.5 w-3.5" />
                                )}
                                Reject
                              </button>
                              <button
                                onClick={() => handleUserDecision(user, "approve")}
                                disabled={Boolean(actionLoading)}
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold cursor-pointer transition-all shadow-md shadow-emerald-500/10 hover:shadow-emerald-600/20 focus:outline-none flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {isApproveLoading ? (
                                  <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <UserCheck2 className="h-3.5 w-3.5" />
                                )}
                                Approve
                              </button>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </motion.div>
            )}

            {/* Tab: APPROVED */}
            {activeTab === "approved" && (
              <motion.div
                key="approved-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {approvedUsers.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl">
                    <UserCheck2 className="h-10 w-10 text-slate-300 mb-3" />
                    <h4 className="text-sm font-semibold text-slate-700">
                      No Approved Users Yet
                    </h4>
                    <p className="text-xs text-slate-400 font-light mt-1">
                      Approve pending profiles to populate your clinical
                      registry.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3">
                        <th className="pb-3.5 font-semibold">User Info</th>
                        <th className="pb-3.5 font-semibold">Assigned Role</th>
                        
                        <th className="pb-3.5 font-semibold">Approval Date</th>
                        <th className="pb-3.5 font-semibold text-right">
                          Access Status
                        </th>
                        <th className="pb-3.5 font-semibold text-right">
                          Action
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {approvedUsers.map((user, idx) => (
                        <tr
                          key={idx}
                          className="group hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-700">
                                {user.name}
                              </span>
                              <span className="text-xs text-slate-400 font-light">
                                {user.email}
                              </span>
                            </div>
                          </td>
                          <td className="py-4">
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                user.role === "Doctor"
                                  ? "bg-primary/10 text-primary border border-primary/20"
                                  : "bg-blue-50 text-blue-700 border border-blue-100"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          
                          <td className="py-4 text-xs text-slate-500">
                            {user.created_at.split("T")[0]}
                          </td>
                          <td className="py-4 text-right">
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-ping" />{" "}
                              Active Panelist
                            </span>
                          </td>
                            <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              <button
                                onClick={() => handleRejectExistingUser(user)}
                                disabled={Boolean(actionLoading)}
                                className="px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-semibold cursor-pointer transition-all focus:outline-none flex items-center gap-1 disabled:opacity-60 disabled:cursor-not-allowed"
                              >
                                {actionLoading === `reject-${user.user_code}` ? (
                                  <span className="h-3.5 w-3.5 border-2 border-rose-200 border-t-rose-600 rounded-full animate-spin" />
                                ) : (
                                  <UserX className="h-3.5 w-3.5" />
                                )}
                                Reject
                              </button>
                             
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </motion.div>
            )}

            {/* Tab: REJECTED */}
            {activeTab === "rejected" && (
              <motion.div
                key="rejected-tab"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {rejectedUsers.length === 0 ? (
                  <div className="text-center py-12 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl">
                    <UserX className="h-10 w-10 text-slate-300 mb-3" />
                    <h4 className="text-sm font-semibold text-slate-700">
                      No Rejected Requests
                    </h4>
                    <p className="text-xs text-slate-400 font-light mt-1">
                      Evaluations show zero applications rejected recently.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-100 text-xs font-semibold text-slate-400 uppercase tracking-wider pb-3">
                        <th className="pb-3.5 font-semibold">User Info</th>
                        <th className="pb-3.5 font-semibold">Target Role</th>
                        <th className="pb-3.5 font-semibold">Audit Date</th>
                        <th className="pb-3.5 font-semibold text-right">
                          Credential State
                        </th>
                       
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {rejectedUsers.map((user,idx) => (
                        <tr
                          key={idx}
                          className="group hover:bg-slate-50/50 transition-colors"
                        >
                          <td className="py-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-700">
                                {user.name}
                              </span>
                              <span className="text-xs text-slate-400 font-light">
                                {user.email}
                              </span>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="text-xs text-slate-500 font-medium">
                              {user.role }
                            </span>
                          </td>
                         
                          <td className="py-4 text-xs text-slate-500">
                            {user.created_at.split("T")[0]}
                          </td>
                          <td className="py-4 text-right">
                            <span className="inline-flex items-center gap-1 text-xs text-rose-600 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                              Access Denied
                            </span>
                          </td>
                          
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {roleModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setRoleModal(null)}
              className="fixed inset-0 bg-slate-950"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 14 }}
              className="bg-white border border-slate-200 w-full max-w-md rounded-2xl shadow-2xl z-10 relative overflow-hidden"
            >
              <div className="h-1.5 bg-gradient-to-r from-primary to-emerald-500" />
              <div className="p-6 space-y-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 font-outfit">
                    Confirm User Role
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Select Doctor or Staff before approving or rejecting this application.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Applicant
                  </span>
                  <span className="block text-sm font-semibold text-slate-800 mt-1">
                    {getUserDisplayName(roleModal.user)}
                  </span>
                  <span className="block text-xs text-slate-500 mt-0.5">
                    Current role: {roleModal.user?.role || "Staff"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {["Doctor", "Staff"].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() =>
                        setRoleModal((current) => ({
                          ...current,
                          role,
                        }))
                      }
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition-all focus:outline-none ${
                        roleModal.role === role
                          ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRoleModal(null)}
                    className="px-4 py-2 text-xs font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 rounded-xl transition-all cursor-pointer focus:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmRole}
                    disabled={actionLoading === `role-${roleModal.user?.user_code}`}
                    className="px-4 py-2 text-xs font-semibold bg-primary hover:bg-primary-hover text-white rounded-xl shadow-md shadow-primary/10 transition-all cursor-pointer focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {actionLoading === `role-${roleModal.user?.user_code}` && (
                      <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    Save Role
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
