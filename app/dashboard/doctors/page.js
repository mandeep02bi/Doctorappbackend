"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Trash2,
} from "lucide-react";

export default function DoctorsRegistryPage() {
  const router = useRouter();

  // 1. Core Doctor Registry State
  const [doctors, setDoctors] = useState([]);

  const fetchdoctors = async () => {
    try {
      const { data } = await api.get("/admin/users");
      const doctor = data?.data?.filter((user) => user.role === "Doctor");
      setDoctors(doctor || []);
    } catch (error) {
      console.error("Error fetching doctors:", error);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      fetchdoctors();
    });
  }, []);

  console.log("Fetched Doctors:", doctors);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showAddDrawer, setShowAddDrawer] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // New Doctor Form States
  const [newDoctor, setNewDoctor] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    role: "Doctor",
  });
  const [formError, setFormError] = useState("");

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Add Doctor Submit Handler
  const handleAddDoctorSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    try {
      const { first_name, last_name, email, phone, password, role } = newDoctor;

      if (!first_name || !last_name || !email || !phone || !password || !role) {
        setFormError("Please fill out all required fields");
        return;
      }
      await api.post("/admin/create-user", newDoctor);
      setNewDoctor({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        password: "",
        role: "Doctor",
      });
      triggerToast(
        `${newDoctor?.first_name} ${newDoctor?.last_name} has been successfully registered!`,
      );
      fetchdoctors();
      setShowAddDrawer(false);
    } catch (error) {
      setFormError(error.response?.data?.message || "An unexpected error occurred. Please try again.");
    }
  };

  const handleDeleteDoctor = async () => {
    if (!selectedDoctor?.user_code) return;

    setDeleteLoading(true);

    try {
      const { data } = await api.delete(`/admin/users/${selectedDoctor.user_code}`);
      if (data.status === false) {
        throw new Error(data.message || "Failed to delete doctor.");
      }

      triggerToast(data.message || "Doctor deleted successfully.");
      setSelectedDoctor(null);
      setDeleteConfirmOpen(false);
      await fetchdoctors();
    } catch (error) {
      triggerToast(error.message || "Unable to delete doctor.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Filter Registry List
  const filteredDoctors = doctors.filter(
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
            Doctors Registry
          </h2>
          
        </div>

        <button
          onClick={() => setShowAddDrawer(true)}
          className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer focus:outline-none"
        >
          <UserPlus className="h-4 w-4" /> Add Doctor 
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
            placeholder="Search by Doctor name, email and number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium whitespace-nowrap self-end md:self-auto">
          Active:{" "}
          <span className="text-slate-800 font-bold">
            {filteredDoctors.length}
          </span>{" "}
          of <span className="text-slate-800">{doctors.length}</span> Doctors
        </div>
      </div>

      {/* Doctors Data Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl py-16 text-center flex flex-col items-center justify-center">
          <Stethoscope className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-700">
            No Physician Records Found
          </h3>
          <p className="text-xs text-slate-400 font-light mt-1">
            Try adjusting your search criteria or register a new doctor.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDoctors.map((doctor) => (
            <motion.div
              key={doctor.user_code}
              onClick={() => router.push(`/dashboard/doctors/${doctor.user_code}`)}
              className="bg-white border border-slate-200 hover:border-primary/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              {/* Top Accent Dot */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-100 group-hover:via-primary/50 to-transparent transition-all" />

              <div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base font-outfit group-hover:text-primary transition-colors">
                      <span>
                        DR. {doctor.first_name} {doctor.last_name}
                      </span>
                    </h3>
                  </div>
                </div>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Building className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="font-medium text-slate-500">
                      +91 {doctor.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Mail className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{doctor.email}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                {/* <span className="text-slate-400 font-light">
                  License: {doctor.license}
                </span> */}
                <span className="text-primary font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  View Folder <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 1. Doctor Folder Details Popup Modal */}
      <AnimatePresence>
        {selectedDoctor && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedDoctor(null);
                setDeleteConfirmOpen(false);
              }}
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
                  setSelectedDoctor(null);
                  setDeleteConfirmOpen(false);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all cursor-pointer focus:outline-none"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              {/* Modal Body (Scrollable) */}
              <div className="p-6 md:p-8 overflow-y-auto space-y-6">
                {/* Header details */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <h3 className="text-2xl font-bold text-slate-800 font-outfit leading-tight">
                    DR. {selectedDoctor.first_name} {selectedDoctor.last_name}
                  </h3>
                </div>

                {/* Contact coordinates */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Contact & Coordinates
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span>{selectedDoctor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span>{selectedDoctor.email}</span>
                    </div>
                    
                  </div>
                </div>
               <div className="p-4 border-t border-slate-100">
                <button
                  onClick={() => setDeleteConfirmOpen(true)}
                  className=" flex items-center gap-3.5 py-3 px-4 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 text-sm font-medium transition-all focus:outline-none cursor-pointer"
                >
                  <Trash2 className="h-5 w-5 shrink-0" />
                  <span className="font-light">Delete Doctor</span>
                </button>
              </div>
              </div>

              {/* Close controls at bottom */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                <button
                  onClick={() => {
                    setSelectedDoctor(null);
                    setDeleteConfirmOpen(false);
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer focus:outline-none"
                >
                  Close Doctor Folder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deleteConfirmOpen && selectedDoctor && (
          <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirmOpen(false)}
              className="fixed inset-0 bg-slate-950"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-2xl"
            >
              <div className="h-1.5 bg-rose-500" />
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600">
                    <Trash2 className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 font-outfit">
                      Delete doctor?
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">
                      Are you sure you want to delete DR. {selectedDoctor.first_name} {selectedDoctor.last_name}? This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                  <button
                    onClick={() => setDeleteConfirmOpen(false)}
                    disabled={deleteLoading}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 focus:outline-none disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteDoctor}
                    disabled={deleteLoading}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-rose-500/15 hover:bg-rose-600 focus:outline-none disabled:opacity-60"
                  >
                    {deleteLoading ? (
                      <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Yes, Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Doctor Onboarding Drawer Form */}
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
                    Register a new licensed medical doctor to active
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
                onSubmit={handleAddDoctorSubmit}
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
                      value={newDoctor.first_name}
                      onChange={(e) =>
                        setNewDoctor({
                          ...newDoctor,
                          first_name: e.target.value,
                        })
                      }
                      placeholder="e.g. Dr. Arthur Morgan"
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
                      value={newDoctor.last_name}
                      onChange={(e) =>
                        setNewDoctor({
                          ...newDoctor,
                          last_name: e.target.value,
                        })
                      }
                      placeholder="e.g. Dr. Arthur Morgan"
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
                    value={newDoctor.email}
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, email: e.target.value })
                    }
                    placeholder="e.g. arthur.morgan@example.com"
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
                    value={newDoctor.password}
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, password: e.target.value })
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
                    value={newDoctor.phone}
                    onChange={(e) =>
                      setNewDoctor({ ...newDoctor, phone: e.target.value })
                    }
                    placeholder="e.g. 832569503"
                    className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-light"
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-3 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none"
                  >
                    <Plus className="h-4.5 w-4.5" /> Save and Authorize Doctor
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
