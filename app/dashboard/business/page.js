"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Briefcase, 
  Clock, 
  Sliders, 
  CheckCircle2, 
  Save, 
  Building2, 
  Phone, 
  Mail, 
  Globe, 
  Info,
  SlidersHorizontal,
  DollarSign
} from "lucide-react";

export default function BusinessSettings() {
  // 1. Clinic General Profile details
  const [profile, setProfile] = useState({
    name: "Adixon Clinic",
    tagline: "Advanced Diagnostics and Comprehensive Healthcare Services",
    license: "LIC-2026-90432-MD",
    phone: "+1 555-0100",
    email: "Adixon@gmail.com",
    website: "https://adixon-clinic.com",
    currency: "USD ($)",
    timezone: "GMT-5 (Eastern Standard Time)"
  });

  // 2. Clinical Shift Hours config
  const [shifts, setShifts] = useState([
    { day: "Monday", active: true, open: "08:00", close: "17:00" },
    { day: "Tuesday", active: true, open: "08:00", close: "17:00" },
    { day: "Wednesday", active: true, open: "08:00", close: "17:00" },
    { day: "Thursday", active: true, open: "08:00", close: "17:00" },
    { day: "Friday", active: true, open: "08:00", close: "16:00" },
    { day: "Saturday", active: false, open: "09:00", close: "13:00" },
    { day: "Sunday", active: false, open: "09:00", close: "12:00" }
  ]);

  // 3. Operational thresholds
  const [params, setParams] = useState({
    slotDuration: "30", // 15, 30, 45, 60
    maxDailyPatients: 25,
    allowEmergencyOverbook: true,
    telehealthEnabled: true,
    autoBackupDays: "7"
  });

  // Saving states
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const handleProfileChange = (key, value) => {
    setProfile(prev => ({ ...prev, [key]: value }));
  };

  const handleShiftToggle = (idx) => {
    setShifts(prev => prev.map((s, i) => i === idx ? { ...s, active: !s.active } : s));
  };

  const handleShiftTimeChange = (idx, field, value) => {
    setShifts(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const handleParamChange = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  // Submit and Save configs
  const handleSaveConfigs = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      setToastMessage("Clinical operational settings saved successfully!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error("Save error", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
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

      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-outfit">Business Settings</h2>
          <p className="text-sm text-slate-500 font-light">
            Configure clinical branding, shift schedules, appointment intervals, and emergency parameters.
          </p>
        </div>
        
        <button
          onClick={handleSaveConfigs}
          disabled={saving}
          className="px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold shadow-md shadow-primary/10 hover:shadow-primary/20 transition-all flex items-center gap-1.5 self-start sm:self-auto cursor-pointer focus:outline-none disabled:opacity-60"
        >
          {saving ? (
            <>
              <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
              <span>Saving Configurations</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Save Settings
            </>
          )}
        </button>
      </div>

      <form onSubmit={handleSaveConfigs} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 1. LEFT COLUMN: General Clinic Profile Card */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Building2 className="h-4.5 w-4.5 text-primary shrink-0" />
              <h3 className="font-bold text-slate-800 font-outfit text-sm">Clinic Profile Details</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Official Clinic/Hospital Name
                </label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => handleProfileChange("name", e.target.value)}
                  className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-light"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Marketing Slogan / Tagline
                </label>
                <input
                  type="text"
                  value={profile.tagline}
                  onChange={(e) => handleProfileChange("tagline", e.target.value)}
                  className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-light"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Registration State License
                  </label>
                  <input
                    type="text"
                    value={profile.license}
                    onChange={(e) => handleProfileChange("license", e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-light bg-slate-50 text-slate-400"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                    Clinical Timezone
                  </label>
                  <select
                    value={profile.timezone}
                    onChange={(e) => handleProfileChange("timezone", e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-white font-light"
                  >
                    <option value="GMT-5 (EST)">GMT-5 (EST Eastern)</option>
                    <option value="GMT+0 (GMT)">GMT+0 (UTC London)</option>
                    <option value="GMT+5.5 (IST)">GMT+5.5 (IST Delhi)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Phone className="h-3 w-3 text-slate-400" /> Clinic Helpdesk Phone
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => handleProfileChange("phone", e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-light"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Mail className="h-3 w-3 text-slate-400" /> Operations Email
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleProfileChange("email", e.target.value)}
                    className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-light"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Globe className="h-3 w-3 text-slate-400" /> Patient Booking Domain
                </label>
                <input
                  type="url"
                  value={profile.website}
                  onChange={(e) => handleProfileChange("website", e.target.value)}
                  className="block w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-light"
                />
              </div>
            </div>
          </div>

          {/* Operational thresholds limits */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <SlidersHorizontal className="h-4.5 w-4.5 text-primary shrink-0" />
              <h3 className="font-bold text-slate-800 font-outfit text-sm">System Parameters</h3>
            </div>

            <div className="space-y-4 text-sm font-light text-slate-600">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800 block text-xs">Standard Appointment Interval</span>
                  <span className="text-[10px] text-slate-400 font-light mt-0.5">Average consult slot width in minutes</span>
                </div>
                <select
                  value={params.slotDuration}
                  onChange={(e) => handleParamChange("slotDuration", e.target.value)}
                  className="px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer hover:border-slate-300"
                >
                  <option value="15">15 Minutes</option>
                  <option value="30">30 Minutes</option>
                  <option value="45">45 Minutes</option>
                  <option value="60">60 Minutes</option>
                </select>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div>
                  <span className="font-semibold text-slate-800 block text-xs">Max Daily Practitioner Load</span>
                  <span className="text-[10px] text-slate-400 font-light mt-0.5">Threshold of patients assigned per doctor</span>
                </div>
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={params.maxDailyPatients}
                  onChange={(e) => handleParamChange("maxDailyPatients", e.target.value)}
                  className="w-16 px-2.5 py-1.5 border border-slate-200 rounded-xl text-xs text-center font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div>
                  <span className="font-semibold text-slate-800 block text-xs">Emergency Overbooking</span>
                  <span className="text-[10px] text-slate-400 font-light mt-0.5">Permit bookings when schedules are full</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleParamChange("allowEmergencyOverbook", !params.allowEmergencyOverbook)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    params.allowEmergencyOverbook ? "bg-primary" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      params.allowEmergencyOverbook ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                <div>
                  <span className="font-semibold text-slate-800 block text-xs">Telehealth Diagnostics</span>
                  <span className="text-[10px] text-slate-400 font-light mt-0.5">Support video consults natively in schedule</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleParamChange("telehealthEnabled", !params.telehealthEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    params.telehealthEnabled ? "bg-primary" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      params.telehealthEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 2. RIGHT COLUMN: Roster Shift Hours */}
        <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Clock className="h-4.5 w-4.5 text-primary shrink-0" />
            <h3 className="font-bold text-slate-800 font-outfit text-sm">Clinic Weekly Operating Hours</h3>
          </div>

          <p className="text-xs text-slate-400 font-light leading-relaxed">
            Specify duty schedules. Days marked as inactive block appointment slots on the patient scheduling application.
          </p>

          <div className="space-y-3.5">
            {shifts.map((shift, idx) => (
              <div 
                key={shift.day}
                className={`p-3.5 border rounded-2xl flex items-center justify-between gap-4 transition-all duration-300 ${
                  shift.active 
                    ? "border-slate-200 bg-white" 
                    : "border-slate-100 bg-slate-50/50 opacity-60"
                }`}
              >
                {/* Active switch and label */}
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleShiftToggle(idx)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      shift.active ? "bg-primary" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        shift.active ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span className={`text-xs font-bold font-outfit ${shift.active ? "text-slate-800" : "text-slate-400"}`}>
                    {shift.day}
                  </span>
                </div>

                {/* Time pickers (only when active) */}
                {shift.active ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="time"
                      value={shift.open}
                      onChange={(e) => handleShiftTimeChange(idx, "open", e.target.value)}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest">To</span>
                    <input
                      type="time"
                      value={shift.close}
                      onChange={(e) => handleShiftTimeChange(idx, "close", e.target.value)}
                      className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none"
                    />
                  </div>
                ) : (
                  <span className="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                    Closed Duty
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
