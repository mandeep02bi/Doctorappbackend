"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/utils/api";
import {
  Search,
  UserPlus,
  FileText,
  X,
  Phone,
  Mail,
  MapPin,
  Heart,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Activity,
  Droplet,
  ChevronRight,
  TrendingUp,
  FileHeart,
  Plus,
  Stethoscope,
  Briefcase,
  Building,
  Award,
} from "lucide-react";

export default function StaffRegistryPage() {
  // 1. Core Staff Registry State
  const [staff, setStaff] = useState([]);

  const fetchStaff = async () => {
    try {
      const { data } = await api.get("/admin/users");
      const staffMembers = data?.data?.filter((user) => user.role === "Staff");
      setStaff(staffMembers || []);
    } catch (error) {
      console.error("Error fetching staff:", error);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchStaff();
    });
  }, []);

  console.log("Fetched Staff:", staff);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // New Staff Form States
  const [newStaff, setNewStaff] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    role: "Staff",
  });
  const [formError, setFormError] = useState("");

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isValidPhone = (value) => /^[0-9]{10}$/.test(value);
  const isStrongPassword = (value) =>
    /[a-z]/.test(value) &&
    /[A-Z]/.test(value) &&
    /[0-9]/.test(value) &&
    /[^A-Za-z0-9]/.test(value);

  const formatDate = (value) => {
    if (!value) return "Not available";
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getStaffMeta = (staffMember) => {
    return [
      staffMember.user_code,
      staffMember.gender,
      staffMember.age ? `${staffMember.age} yrs` : null,
    ]
      .filter(Boolean)
      .join(" | ");
  };

  const getStaffLocation = (staffMember) => {
    return [staffMember.city, staffMember.state].filter(Boolean).join(", ");
  };

  const openStaffFolder = async (staffMember) => {
    setSelectedStaff(staffMember);
    setDeleteConfirmOpen(false);
    setDetailLoading(true);

    try {
      const { data } = await api.get(`/admin/users/${staffMember.user_code}`);
      if (data.status === false) {
        throw new Error(data.message || "Failed to fetch staff details.");
      }

      setSelectedStaff(data.data || staffMember);
    } catch (error) {
      triggerToast(error.message || "Unable to load full staff details.");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff?.user_code) return;

    setDeleteLoading(true);

    try {
      const { data } = await api.delete(`/admin/users/${selectedStaff.user_code}`);
      if (data.status === false) {
        throw new Error(data.message || "Failed to delete staff member.");
      }

      triggerToast(data.message || "Staff member deleted successfully.");
      setSelectedStaff(null);
      setDeleteConfirmOpen(false);
      fetchStaff();
    } catch (error) {
      triggerToast(error.message || "Unable to delete staff member.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Add Staff Submit Handler
  const handleAddStaffSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    try {
      const { first_name, last_name, email, phone, password, role } = newStaff;

      if (!first_name || !last_name || !email || !phone || !password || !role) {
        setFormError("Please fill out all required fields");
        return;
      }

      if (!isValidEmail(email)) {
        setFormError("Please enter a valid email address.");
        return;
      }

      if (!isValidPhone(phone)) {
        setFormError("Phone number must be exactly 10 digits.");
        return;
      }

      if (!isStrongPassword(password)) {
        setFormError("Password must include uppercase, lowercase, number, and special character.");
        return;
      }

      await api.post("/admin/create-user", newStaff);
      setNewStaff({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        role: "Staff",
      });
      triggerToast(
        `${newStaff?.first_name} ${newStaff?.last_name} has been successfully registered!`,
      );
      fetchStaff();
      setShowAddDrawer(false);
    } catch (error) {
      setFormError(error.response?.data?.message || "An unexpected error occurred. Please try again.");
    }
  };

  // Filter Registry List
  const filteredStaff = staff.filter(
    (d) =>
      d.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.phone.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      {/* Toast confirmation */}
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

      {/* Header bar controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-outfit">
            Staff Registry
          </h2>
          
        </div>

        <button
          onClick={() => setShowAddDrawer(true)}
          className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer focus:outline-none"
        >
          <UserPlus className="h-4 w-4" /> Add Staff 
        </button>
      </div>

      {/* Filter and Search Panel */}
      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 border border-slate-200/80 rounded-2xl shadow-sm">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by staff name, email, and phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium whitespace-nowrap self-end md:self-auto">
          Active roster specialists:{" "}
          <span className="text-slate-800 font-bold">
            {filteredStaff.length}
          </span>{" "}
          of <span className="text-slate-800">{staff.length}</span> staff members
        </div>
      </div>

      {/* Staff Data Grid */}
      {filteredStaff.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl py-16 text-center flex flex-col items-center justify-center">
          <Stethoscope className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-700">
            No Staff Records Found
          </h3>
          <p className="text-xs text-slate-400 font-light mt-1">
            Try adjusting your search criteria or register a new staff member.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredStaff.map((staffMember) => (
            <motion.div
              key={staffMember.user_code}
              onClick={() => openStaffFolder(staffMember)}
              className="bg-white border border-slate-200 hover:border-primary/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Top Accent Dot */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-100 group-hover:via-primary/50 to-transparent transition-all" />

              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base font-outfit group-hover:text-primary transition-colors">
                      <span>
                       {staffMember.first_name} {staffMember.last_name}
                      </span>
                    </h3>
                    {getStaffMeta(staffMember) && (
                      <p className="text-xs text-slate-400 mt-1">
                        {getStaffMeta(staffMember)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Building className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="font-medium text-slate-500">
                      +91 {staffMember.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{staffMember.email}</span>
                  </div>
                  {getStaffLocation(staffMember) && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{getStaffLocation(staffMember)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                {/* <span className="text-slate-400 font-light">
                  License: {staffMember.license}
                </span> */}
                <span className="text-primary font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  View Folder <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 1. Staff Folder Details Popup Modal */}
      <AnimatePresence>
        {selectedStaff && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStaff(null)}
              className="fixed inset-0 bg-slate-950"
            />
            <motion.div
              className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl z-10 relative overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal top colors based on condition severity */}
              <div className="h-2.5 bg-gradient-to-r from-primary to-emerald-500 shrink-0" />

              {/* Close Button */}
              <button
                onClick={() => {
                  setSelectedStaff(null);
                  setDeleteConfirmOpen(false);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all cursor-pointer focus:outline-none"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 md:p-8 overflow-y-auto space-y-6">
                {detailLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                    <span className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
                    <span className="text-xs font-semibold">Loading staff folder...</span>
                  </div>
                ) : (
                  <>
                {/* Header details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-800 font-outfit leading-tight">
                      {selectedStaff.first_name} {selectedStaff.last_name}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {selectedStaff.user_code} | {selectedStaff.role}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                    {selectedStaff.isVerified ? "Verified" : "Pending Verification"}
                  </span>
                </div>

                {/* Contact coordinates */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Contact & Coordinates
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{selectedStaff.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span>{selectedStaff.email}</span>
                    </div>
                    {/* <div className="flex items-start gap-2 sm:col-span-2">
                      <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                      <span>{selectedStaff.address}</span>
                    </div> */}
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Activity Statistics
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {[
                      ["Appointments", selectedStaff.stats?.total_appointments || 0],
                      ["Prescriptions", selectedStaff.stats?.total_prescriptions || 0],
                      ["Certificates", selectedStaff.stats?.total_certificates || 0],
                      ["Instructions", selectedStaff.stats?.total_instructions || 0],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <span className="block text-xl font-bold text-slate-800">{value}</span>
                        <span className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-1">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Platform</span>
                    <span className="block mt-1 text-slate-700">{selectedStaff.platform || "Not available"}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Device Type</span>
                    <span className="block mt-1 text-slate-700">{selectedStaff.device_type || "Not available"}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Last Login</span>
                    <span className="block mt-1 text-slate-700">{formatDate(selectedStaff.last_login_at)}</span>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-white p-3">
                    <span className="block text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Created</span>
                    <span className="block mt-1 text-slate-700">{formatDate(selectedStaff.created_at)}</span>
                  </div>
                </div>

                {deleteConfirmOpen && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600">
                        <AlertCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-rose-800">Delete this staff member?</p>
                        <p className="text-xs text-rose-600 mt-1">
                          This action will remove the user from the registry.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex justify-end gap-2">
                      <button
                        onClick={() => setDeleteConfirmOpen(false)}
                        className="px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteStaff}
                        disabled={deleteLoading}
                        className="px-3 py-2 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg flex items-center gap-2 disabled:opacity-60"
                      >
                        {deleteLoading && <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        Delete Staff
                      </button>
                    </div>
                  </div>
                )}
                  </>
                )}
              </div>

              {/* Close controls at bottom */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between gap-3 shrink-0">
                <button
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={detailLoading}
                  className="px-4 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl transition-all cursor-pointer focus:outline-none flex items-center gap-1.5 disabled:opacity-60"
                >
                  <AlertCircle className="h-4 w-4" />
                  Delete Staff
                </button>
                <button
                  onClick={() => {
                    setSelectedStaff(null);
                    setDeleteConfirmOpen(false);
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer focus:outline-none"
                >
                  Close Staff Folder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Staff Onboarding Drawer Form */}
      <AnimatePresence>
        {showAddDrawer && (
          <div className="fixed inset-0 flex justify-end z-50">
            {/* Dark overlay backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddDrawer(false)}
              className="fixed inset-0 bg-slate-950"
            />
            {/* Sidebar drawer content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="bg-white border-l border-slate-200 w-full max-w-md h-full z-10 relative flex flex-col"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-200 flex items-center justify-between shrink-0 bg-slate-50">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 font-outfit">
                    Onboard Specialist
                  </h3>
                  <p className="text-xs text-slate-400 font-light">
                    Register a new licensed medical Satff to active
                    directories.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddDrawer(false)}
                  className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 focus:outline-none"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Form body */}
              <form
                onSubmit={handleAddStaffSubmit}
                className="flex-1 overflow-y-auto p-6 space-y-4 font-outfit"
              >
                {formError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2 leading-relaxed">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      First Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newStaff.first_name}
                      onChange={(e) =>
                        setNewStaff({
                          ...newStaff,
                          first_name: e.target.value,
                        })
                      }
                      placeholder="e.g. Mukesh "
                      className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-light"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Last Name
                    </label>
                    <input
                      type="text"
                      required
                      value={newStaff.last_name}
                      onChange={(e) =>
                        setNewStaff({
                          ...newStaff,
                          last_name: e.target.value,
                        })
                      }
                      placeholder="e.g. Desai"
                      className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-light"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={newStaff.email}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, email: e.target.value.trim() })
                    }
                    placeholder="e.g. mikesh.desai@example.com"
                    className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-light"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newStaff.password}
                    onChange={(e) =>
                      setNewStaff({ ...newStaff, password: e.target.value })
                    }
                    placeholder="e.g. ********"
                    className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-light"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    required
                    inputMode="numeric"
                    maxLength={10}
                    value={newStaff.phone}
                    onChange={(e) =>
                      setNewStaff({
                        ...newStaff,
                        phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                      })
                    }
                    placeholder="e.g. 9568750231"
                    className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-light"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none"
                  >
                    <Plus className="h-4.5 w-4.5" /> Save and Authorize Staff
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
