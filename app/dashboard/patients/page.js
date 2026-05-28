"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import api from "@/utils/api";
import {
  AlertCircle,
  Calendar,
  ChevronRight,
  ClipboardList,
  Droplet,
  FileText,
  Mail,
  MapPin,
  Phone,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

function InfoTile({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2 text-slate-400">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <span className="block text-sm font-semibold text-slate-700 mt-1 truncate">
        {value || "Not available"}
      </span>
    </div>
  );
}

function DetailBlock({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2 text-slate-400">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <p className="text-sm text-slate-700 mt-2 leading-relaxed whitespace-pre-wrap break-words">
        {value || "Not available"}
      </p>
    </div>
  );
}

export default function PatientsPage() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientLoading, setPatientLoading] = useState(false);
  const [prescriptions, setPrescriptions] = useState([]);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [showPrescriptionList, setShowPrescriptionList] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [prescriptionDetailLoading, setPrescriptionDetailLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [patientDeleteConfirmOpen, setPatientDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const triggerToast = (msg, type = "success") => {
    setToastMessage({ text: msg, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const formatDate = (value) => {
    if (!value) return "Not available";
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getPatientName = (patient) => {
    return [patient?.first_name, patient?.middle_name, patient?.last_name]
      .filter(Boolean)
      .join(" ") || "Unnamed Patient";
  };

  const fetchPatientSearch = useCallback(async (query) => {
    setSearchLoading(true);

    try {
      const { data } = await api.get("/patients/search", { params: { q: query } });
      if (data.status === false) {
        throw new Error(data.message || "Failed to search patients.");
      }

      setPatients(data.data || []);
    } catch (error) {
      triggerToast(error.message || "Unable to search patients.", "error");
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const fetchPatients = useCallback(async () => {
    try {
      const { data } = await api.get("/patients");
      if (data.status === false) {
        throw new Error(data.message || "Failed to fetch patients.");
      }

      setPatients(data.data || []);
    } catch (error) {
      triggerToast(error.message || "Unable to fetch patients.", "error");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      fetchPatients();
    });
  }, [fetchPatients]);

  useEffect(() => {
    const query = searchTerm.trim();
    const timeout = setTimeout(() => {
      if (query) {
        fetchPatientSearch(query);
      } else {
        fetchPatients();
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [fetchPatientSearch, fetchPatients, searchTerm]);

  const filteredPatients = useMemo(() => patients, [patients]);

  const latestPrescription = useMemo(() => {
    return [...prescriptions].sort((a, b) => {
      return new Date(b.prescription_date || b.created_at || 0) - new Date(a.prescription_date || a.created_at || 0);
    })[0];
  }, [prescriptions]);

  const fetchPrescriptions = async (patientCode) => {
    setPrescriptionsLoading(true);

    try {
      const { data } = await api.get("/prescriptions", {
        params: { patient_code: patientCode, sort: "oldest" },
      });
      if (data.status === false) {
        throw new Error(data.message || "Failed to fetch prescriptions.");
      }

      setPrescriptions(data.data || []);
    } catch (error) {
      setPrescriptions([]);
      triggerToast(error.message || "Unable to fetch prescriptions.", "error");
    } finally {
      setPrescriptionsLoading(false);
    }
  };

  const openPatientFolder = async (patient) => {
    setSelectedPatient(patient);
    setShowPrescriptionList(false);
    setSelectedPrescription(null);
    setDeleteConfirmOpen(false);
    setPatientDeleteConfirmOpen(false);
    setPatientLoading(true);

    try {
      const { data } = await api.get(`/patients/${patient.patient_code}`);
      if (data.status === false) {
        throw new Error(data.message || "Failed to fetch patient.");
      }

      setSelectedPatient(data.data || patient);
      await fetchPrescriptions(patient.patient_code);
    } catch (error) {
      triggerToast(error.message || "Unable to load patient folder.", "error");
    } finally {
      setPatientLoading(false);
    }
  };

  const openPrescriptionDetail = async (prescription) => {
    setSelectedPrescription(prescription);
    setDeleteConfirmOpen(false);
    setPrescriptionDetailLoading(true);

    try {
      const { data } = await api.get(`/prescriptions/${prescription.id}`);
      if (data.status === false) {
        throw new Error(data.message || "Failed to fetch prescription.");
      }

      setSelectedPrescription(data.data || prescription);
    } catch (error) {
      triggerToast(error.message || "Unable to load prescription.", "error");
    } finally {
      setPrescriptionDetailLoading(false);
    }
  };

  const deletePrescription = async () => {
    if (!selectedPrescription?.id) return;

    setDeleteLoading(true);

    try {
      const { data } = await api.delete(`/prescriptions/${selectedPrescription.id}`);
      if (data.status === false) {
        throw new Error(data.message || "Failed to delete prescription.");
      }

      triggerToast(data.message || "Prescription deleted.");
      setSelectedPrescription(null);
      setDeleteConfirmOpen(false);
      if (selectedPatient?.patient_code) {
        await fetchPrescriptions(selectedPatient.patient_code);
      }
    } catch (error) {
      triggerToast(error.message || "Unable to delete prescription.", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const deletePatient = async () => {
    if (!selectedPatient?.patient_code) return;

    setDeleteLoading(true);

    try {
      const { data } = await api.delete(`/patients/${selectedPatient.patient_code}`);
      if (data.status === false) {
        throw new Error(data.message || "Failed to delete patient.");
      }

      triggerToast(data.message || "Patient deleted.");
      closePatientFolder();
      await fetchPatients();
    } catch (error) {
      triggerToast(error.message || "Unable to delete patient.", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const closePatientFolder = () => {
    setSelectedPatient(null);
    setShowPrescriptionList(false);
    setSelectedPrescription(null);
    setDeleteConfirmOpen(false);
    setPatientDeleteConfirmOpen(false);
    setPrescriptions([]);
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold border ${
              toastMessage.type === "error"
                ? "bg-rose-50 border-rose-200 text-rose-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            }`}
          >
            <AlertCircle className="h-5 w-5" />
            {toastMessage.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-outfit">
          Patients Registry
        </h2>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-4 bg-white p-4 border border-slate-200/80 rounded-2xl shadow-sm">
        <div className="relative flex-1 w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            placeholder="Search by patient name, code, phone, email, or city..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
          />
        </div>
        <div className="text-xs text-slate-400 font-medium whitespace-nowrap self-end md:self-auto">
          {searchLoading ? "Searching..." : "Patients:"} <span className="text-slate-800 font-bold">{filteredPatients.length}</span>{" "}
          of <span className="text-slate-800">{patients.length}</span>
        </div>
      </div>

      {filteredPatients.length === 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl py-16 text-center flex flex-col items-center justify-center">
          <UserRound className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-700">No Patients Found</h3>
          <p className="text-xs text-slate-400 font-light mt-1">
            Try a different search term.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPatients.map((patient) => (
            <motion.div
              key={patient.patient_code}
              onClick={() => router.push(`/dashboard/patients/${patient.patient_code}`)}
              className="bg-white border border-slate-200 hover:border-primary/40 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-slate-100 group-hover:via-primary/50 to-transparent transition-all" />
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-base font-outfit group-hover:text-primary transition-colors">
                      {getPatientName(patient)}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {patient.patient_code} | {patient.gender || "Unknown"} | {patient.age || "-"} yrs
                    </p>
                  </div>
                  <span className="rounded-lg bg-primary/10 border border-primary/20 px-2 py-1 text-[10px] font-bold text-primary">
                    {patient.blood_group || "N/A"}
                  </span>
                </div>

                <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="font-medium text-slate-500">+91 {patient.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{patient.city || "City not available"}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
                <span className="text-slate-400">{formatDate(patient.created_at)}</span>
                <span className="text-primary font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                  View Folder <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedPatient && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={closePatientFolder}
              className="fixed inset-0 bg-slate-950"
            />
            <motion.div
              className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl shadow-2xl z-10 relative overflow-hidden flex flex-col max-h-[88vh]"
            >
              <div className="h-2.5 bg-gradient-to-r from-primary to-emerald-500 shrink-0" />
              <button
                onClick={closePatientFolder}
                className="absolute top-4 right-4 p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all cursor-pointer focus:outline-none"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="p-6 md:p-8 overflow-y-auto space-y-6">
                {patientLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                    <span className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
                    <span className="text-xs font-semibold">Loading patient folder...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800 font-outfit leading-tight">
                          {getPatientName(selectedPatient)}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {selectedPatient.patient_code} | {selectedPatient.gender || "Unknown"} | {selectedPatient.age || "-"} yrs
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-xs text-rose-700 font-semibold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-100">
                          <Droplet className="h-3.5 w-3.5" />
                          {selectedPatient.blood_group || "N/A"}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-semibold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
                          {prescriptions.length} prescriptions
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <InfoTile label="Email" value={selectedPatient.email} icon={Mail} />
                      <InfoTile label="Phone" value={selectedPatient.phone} icon={Phone} />
                      <InfoTile label="Birth Date" value={formatDate(selectedPatient.date_of_birth)} icon={Calendar} />
                      <InfoTile label="Address" value={selectedPatient.street_address} icon={MapPin} />
                      <InfoTile label="City / State" value={[selectedPatient.city, selectedPatient.state].filter(Boolean).join(", ")} icon={MapPin} />
                      <InfoTile label="ZIP Code" value={selectedPatient.zip_code} icon={MapPin} />
                      <InfoTile label="Created By" value={selectedPatient.created_by_name} icon={UserRound} />
                      <InfoTile label="Registered" value={formatDate(selectedPatient.created_at)} icon={Calendar} />
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 font-outfit">
                            Prescriptions
                          </h4>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Latest prescription preview with full history available.
                          </p>
                        </div>
                        <button
                          onClick={() => setShowPrescriptionList((value) => !value)}
                          className="px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-semibold shadow-md shadow-primary/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer focus:outline-none"
                        >
                          <FileText className="h-4 w-4" />
                          {showPrescriptionList ? "Hide Prescriptions" : "See Full Prescriptions"}
                        </button>
                      </div>

                      <div className="mt-4">
                        {prescriptionsLoading ? (
                          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-400">
                            Loading latest prescription...
                          </div>
                        ) : latestPrescription ? (
                          <button
                            onClick={() => openPrescriptionDetail(latestPrescription)}
                            className="w-full text-left rounded-xl border border-primary/20 bg-white p-4 hover:border-primary/50 transition-all"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="min-w-0">
                                <span className="block text-xs font-semibold text-primary uppercase tracking-wider">
                                  Latest Prescription
                                </span>
                                <span className="block text-sm font-bold text-slate-800 mt-1 truncate">
                                  {latestPrescription.diagnosis || "Diagnosis not added"}
                                </span>
                                <span className="block text-xs text-slate-400 mt-1 truncate">
                                  {latestPrescription.chief_complaint || "No complaint"} | Dr. {latestPrescription.doctor_name || "Not assigned"}
                                </span>
                              </div>
                              <span className="text-xs text-slate-500 shrink-0">
                                {formatDate(latestPrescription.prescription_date)}
                              </span>
                            </div>
                          </button>
                        ) : (
                          <div className="rounded-xl border border-slate-200 bg-white p-4 text-xs text-slate-400">
                            No prescriptions found for this patient.
                          </div>
                        )}
                      </div>

                      {showPrescriptionList && (
                        <div className="mt-4 max-h-80 overflow-y-auto pr-1 space-y-3">
                          {prescriptionsLoading ? (
                            <div className="py-6 text-center text-xs text-slate-400">
                              Loading prescriptions...
                            </div>
                          ) : prescriptions.length === 0 ? (
                            <div className="py-6 text-center text-xs text-slate-400">
                              No prescriptions found for this patient.
                            </div>
                          ) : (
                            prescriptions.map((prescription) => (
                              <button
                                key={prescription.id}
                                onClick={() => openPrescriptionDetail(prescription)}
                                className="w-full text-left bg-white border border-slate-200 hover:border-primary/40 rounded-xl p-4 transition-all cursor-pointer"
                              >
                                <div className="flex items-center justify-between gap-3">
                                  <div className="min-w-0">
                                    <span className="block text-sm font-semibold text-slate-800 truncate">
                                      {prescription.diagnosis || "Diagnosis not added"}
                                    </span>
                                    <span className="block text-xs text-slate-400 mt-1 truncate">
                                      {prescription.chief_complaint || "No complaint"} | Dr. {prescription.doctor_name || "Not assigned"}
                                    </span>
                                  </div>
                                  <span className="text-xs text-slate-500 shrink-0">
                                    {formatDate(prescription.prescription_date)}
                                  </span>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {patientDeleteConfirmOpen && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600">
                            <AlertCircle className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-rose-800">Delete this patient?</p>
                            <p className="text-xs text-rose-600 mt-1">
                              This will remove the patient record from the registry.
                            </p>
                          </div>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                          <button
                            onClick={() => setPatientDeleteConfirmOpen(false)}
                            className="px-3 py-2 text-xs font-semibold text-slate-600 border border-slate-200 bg-white rounded-lg hover:bg-slate-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={deletePatient}
                            disabled={deleteLoading}
                            className="px-3 py-2 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg flex items-center gap-2 disabled:opacity-60"
                          >
                            {deleteLoading && <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            Delete Patient
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
                <button
                  onClick={() => setPatientDeleteConfirmOpen(true)}
                  disabled={patientLoading}
                  className="mr-auto px-4 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl transition-all cursor-pointer focus:outline-none flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Patient
                </button>
                <button
                  onClick={closePatientFolder}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer focus:outline-none"
                >
                  Close Patient Folder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedPrescription && (
          <div className="fixed inset-0 flex items-center justify-center z-[60] p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.65 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedPrescription(null);
                setDeleteConfirmOpen(false);
              }}
              className="fixed inset-0 bg-slate-950"
            />
            <motion.div
              className="bg-white border border-slate-200 w-full max-w-4xl rounded-2xl shadow-2xl z-10 relative overflow-hidden flex flex-col max-h-[88vh]"
            >
              <div className="h-2.5 bg-gradient-to-r from-primary to-blue-500 shrink-0" />
              <button
                onClick={() => {
                  setSelectedPrescription(null);
                  setDeleteConfirmOpen(false);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 transition-all cursor-pointer focus:outline-none"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="p-6 md:p-8 overflow-y-auto space-y-6">
                {prescriptionDetailLoading ? (
                  <div className="py-16 flex flex-col items-center justify-center text-slate-400">
                    <span className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-3" />
                    <span className="text-xs font-semibold">Loading prescription...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-2xl font-bold text-slate-800 font-outfit">
                          {selectedPrescription.diagnosis || "Prescription Detail"}
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">
                          {formatDate(selectedPrescription.prescription_date)} | Dr. {selectedPrescription.doctor_name || "Not available"}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs text-primary font-semibold bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                        {selectedPrescription.patient_code}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        ["Temp", selectedPrescription.temperature],
                        ["BP", selectedPrescription.blood_pressure],
                        ["Pulse", selectedPrescription.pulse],
                        ["SPO2", selectedPrescription.spo2],
                        ["Height", selectedPrescription.height],
                        ["Weight", selectedPrescription.weight],
                        ["Sugar", selectedPrescription.blood_sugar],
                        ["Hemoglobin", selectedPrescription.hemoglobin],
                      ].map(([label, value]) => (
                        <InfoTile key={label} label={label} value={value} />
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <DetailBlock label="Chief Complaint" value={selectedPrescription.chief_complaint} icon={ClipboardList} />
                      <DetailBlock label="History" value={selectedPrescription.history} icon={ClipboardList} />
                      <DetailBlock label="Findings" value={selectedPrescription.findings} icon={ClipboardList} />
                      <DetailBlock label="Allergy" value={selectedPrescription.allergy} icon={AlertCircle} />
                      <DetailBlock label="Treatment Advice" value={selectedPrescription.treatment_advice} icon={FileText} />
                      <InfoTile label="Follow Up" value={formatDate(selectedPrescription.follow_up_date)} icon={Calendar} />
                    </div>

                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Medicines
                      </h4>
                      {(selectedPrescription.medicines || []).length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-400">
                          No medicines added.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedPrescription.medicines.map((medicine) => (
                            <div key={medicine.id} className="rounded-xl border border-slate-200 bg-white p-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <span className="font-semibold text-slate-800">{medicine.name}</span>
                                <span className="text-xs text-slate-400">{medicine.total_quantity} qty | {medicine.no_of_days} days</span>
                              </div>
                              <p className="text-xs text-slate-500 mt-2">
                                {medicine.frequency} | {medicine.route_form} | {medicine.instructions}
                              </p>
                              {medicine.additional_comments && (
                                <p className="text-xs text-slate-400 mt-1">{medicine.additional_comments}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Lab Tests
                      </h4>
                      {(selectedPrescription.lab_tests || []).length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-400">
                          No lab tests added.
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedPrescription.lab_tests.map((test) => (
                            <div key={test.id} className="rounded-xl border border-slate-200 bg-white p-4">
                              <span className="font-semibold text-slate-800">{test.test_name}</span>
                              {test.additional_comments && (
                                <p className="text-xs text-slate-400 mt-1">{test.additional_comments}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {selectedPrescription.end_note && (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">End Note</span>
                        <p className="text-sm text-slate-600 mt-1">{selectedPrescription.end_note}</p>
                      </div>
                    )}

                    {deleteConfirmOpen && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600">
                            <AlertCircle className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-rose-800">Delete this prescription?</p>
                            <p className="text-xs text-rose-600 mt-1">
                              This action cannot be undone.
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
                            onClick={deletePrescription}
                            disabled={deleteLoading}
                            className="px-3 py-2 text-xs font-semibold text-white bg-rose-500 hover:bg-rose-600 rounded-lg flex items-center gap-2 disabled:opacity-60"
                          >
                            {deleteLoading && <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            Delete Prescription
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between gap-3 shrink-0">
                <button
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={prescriptionDetailLoading}
                  className="px-4 py-2 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-xl transition-all cursor-pointer focus:outline-none flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Prescription
                </button>
                <button
                  onClick={() => {
                    setSelectedPrescription(null);
                    setDeleteConfirmOpen(false);
                  }}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer focus:outline-none"
                >
                  Close Prescription
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
