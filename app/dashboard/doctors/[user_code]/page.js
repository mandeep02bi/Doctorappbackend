"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/utils/api";
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileHeart,
  Mail,
  MonitorSmartphone,
  Phone,
  ShieldCheck,
  Stethoscope,
  Trash2,
  Users,
} from "lucide-react";

function InfoTile({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-slate-400">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <span className="mt-2 block break-words text-sm font-semibold text-slate-700">
        {value || "Not available"}
      </span>
    </div>
  );
}

function StatTile({ label, value, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        {Icon && (
          <span className="rounded-xl bg-primary/10 p-2 text-primary">
            <Icon className="h-5 w-5" />
          </span>
        )}
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-800">{value ?? 0}</p>
    </div>
  );
}

function ProfileSection({ title, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-800 font-outfit">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export default function DoctorDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userCode = params?.user_code;

  const [doctor, setDoctor] = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientsLoading, setPatientsLoading] = useState(false);
  const [showAllPatients, setShowAllPatients] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const triggerToast = (msg, type = "success") => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatDate = (value, withTime = false) => {
    if (!value) return "Not available";
    return new Date(value).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    });
  };

  const getDoctorName = (record) => {
    const name = [record?.first_name, record?.last_name].filter(Boolean).join(" ").trim();
    return name ? `Dr. ${name}` : "Doctor";
  };

  const getPatientName = (record) => {
    return [record?.first_name, record?.middle_name, record?.last_name]
      .filter(Boolean)
      .join(" ") || "Unnamed Patient";
  };

  const loadDoctorProfile = useCallback(async () => {
    if (!userCode) return;
    setLoading(true);
    setPatientsLoading(true);

    try {
      const [doctorResult, patientResult] = await Promise.allSettled([
        api.get(`/admin/users/${userCode}`),
        api.get("/patients", { params: { doctor_code: userCode } }),
      ]);

      if (doctorResult.status === "rejected") {
        throw doctorResult.reason;
      }

      const doctorPayload = doctorResult.value.data;
      if (doctorPayload.status === false) {
        throw new Error(doctorPayload.message || "Failed to fetch doctor.");
      }

      setDoctor(doctorPayload.data || null);

      if (patientResult.status === "fulfilled") {
        const patientPayload = patientResult.value.data;
        if (patientPayload.status === false) {
          triggerToast(patientPayload.message || "Unable to load doctor patients.", "error");
          setPatients([]);
        } else {
          setPatients(patientPayload.data || []);
        }
      } else {
        setPatients([]);
        triggerToast("Unable to load doctor patients.", "error");
      }
    } catch (error) {
      triggerToast(error.message || "Unable to load doctor profile.", "error");
    } finally {
      setLoading(false);
      setPatientsLoading(false);
    }
  }, [userCode]);

  useEffect(() => {
    queueMicrotask(() => {
      loadDoctorProfile();
    });
  }, [loadDoctorProfile]);

  const visiblePatients = useMemo(() => {
    return showAllPatients ? patients : patients.slice(0, 5);
  }, [patients, showAllPatients]);

  const deleteDoctor = async () => {
    if (!doctor?.user_code) return;
    setDeleteLoading(true);

    try {
      const { data } = await api.delete(`/admin/users/${doctor.user_code}`);
      if (data.status === false) {
        throw new Error(data.message || "Failed to delete doctor.");
      }

      triggerToast(data.message || "Doctor deleted successfully.");
      setDeleteConfirmOpen(false);
      setTimeout(() => {
        router.push("/dashboard/doctors");
      }, 650);
    } catch (error) {
      triggerToast(error.message || "Unable to delete doctor.", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl border p-4 text-sm font-semibold shadow-xl ${
          toastMessage.type === "error"
            ? "border-rose-200 bg-rose-50 text-rose-800"
            : "border-emerald-200 bg-emerald-50 text-emerald-800"
        }`}>
          {toastMessage.type === "error" ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
          {toastMessage.text}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-sm font-semibold text-slate-400">
          Loading doctor profile...
        </div>
      ) : !doctor ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-sm font-semibold text-slate-400">
          Doctor profile not found.
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-5 border-b border-slate-100 pb-5 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                  <Stethoscope className="h-3.5 w-3.5" />
                  {doctor.user_code || userCode}
                </div>
                <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-800 font-outfit md:text-3xl">
                  {getDoctorName(doctor)}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Registered {formatDate(doctor.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {doctor.isVerified ? "Verified" : "Not verified"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  <Users className="h-3.5 w-3.5" />
                  {patients.length} patients
                </span>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 focus:outline-none"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Doctor
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-4">
                <ProfileSection title="Contact">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoTile label="Email" value={doctor.email} icon={Mail} />
                    <InfoTile label="Phone" value={doctor.phone ? `+91 ${doctor.phone}` : "Not available"} icon={Phone} />
                  </div>
                </ProfileSection>

                <ProfileSection title="Device">
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <InfoTile label="Platform" value={doctor.platform} icon={MonitorSmartphone} />
                    <InfoTile label="Device Type" value={doctor.device_type} icon={MonitorSmartphone} />
                  </div>
                </ProfileSection>
              </div>

              <ProfileSection title="Login & Created">
                <div className="grid grid-cols-1 gap-3">
                  <InfoTile label="Last Login" value={formatDate(doctor.last_login_at, true)} icon={Clock} />
                  <InfoTile label="Created At" value={formatDate(doctor.created_at, true)} icon={Calendar} />
                </div>
              </ProfileSection>
            </div>
          </section>

          {deleteConfirmOpen && (
            <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-rose-800 font-outfit">Delete this doctor?</h3>
                    <p className="mt-1 text-xs text-rose-600">
                      Are you sure you want to delete {getDoctorName(doctor)}? This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(false)}
                    disabled={deleteLoading}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={deleteDoctor}
                    disabled={deleteLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-60"
                  >
                    {deleteLoading ? (
                      <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Yes, Delete
                  </button>
                </div>
              </div>
            </section>
          )}

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                <h3 className="text-sm font-bold text-slate-800 font-outfit">Doctor Stats</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                <StatTile label="Appointments" value={doctor.stats?.total_appointments} icon={Calendar} />
                <StatTile label="Prescriptions" value={doctor.stats?.total_prescriptions} icon={FileHeart} />
                <StatTile label="Certificates" value={doctor.stats?.total_certificates} icon={ShieldCheck} />
                <StatTile label="Instructions" value={doctor.stats?.total_instructions} icon={Stethoscope} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                <h3 className="text-sm font-bold text-slate-800 font-outfit">Access Snapshot</h3>
              </div>
              <div className="space-y-3 p-5">
                <InfoTile label="Verification" value={doctor.isVerified ? "Verified" : "Pending verification"} icon={ShieldCheck} />
                <InfoTile label="Last Login" value={formatDate(doctor.last_login_at, true)} icon={Clock} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 font-outfit">Assigned Patients</h3>
              </div>
              {patients.length > 5 && (
                <button
                  type="button"
                  onClick={() => setShowAllPatients((value) => !value)}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white shadow-md shadow-primary/10 hover:bg-primary-hover focus:outline-none"
                >
                  {showAllPatients ? "Show Less" : "See Full List"}
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className={`${patients.length > 10 ? "admin-scroll-panel" : ""} p-5`}>
              {patientsLoading ? (
                <div className="py-10 text-center text-xs font-semibold text-slate-400">Loading patients...</div>
              ) : patients.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                  No patients found for this doctor.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {visiblePatients.map((patient) => (
                    <button
                      key={patient.patient_code}
                      type="button"
                      onClick={() => router.push(`/dashboard/patients/${patient.patient_code}`)}
                      className="group rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-primary/40 hover:bg-primary/5 focus:outline-none"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="block truncate text-sm font-bold text-slate-800 group-hover:text-primary">
                            {getPatientName(patient)}
                          </span>
                          <span className="mt-1 block text-xs font-semibold text-slate-400">
                            {patient.patient_code || "No patient code"}
                          </span>
                          <span className="mt-2 block truncate text-xs text-slate-500">
                            {[patient.gender, patient.age ? `${patient.age} yrs` : null, patient.phone].filter(Boolean).join(" | ") || "Patient details not available"}
                          </span>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-primary" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
