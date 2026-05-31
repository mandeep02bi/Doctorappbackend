"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/utils/api";
import {
  AlertCircle,
  Calendar,
  ClipboardList,
  Droplet,
  FileText,
  Mail,
  MapPin,
  Phone,
  Stethoscope,
  Trash2,
  UserRound,
} from "lucide-react";

function InfoTile({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center gap-2 text-slate-400">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        <span className="text-[10px] uppercase tracking-wider font-semibold">{label}</span>
      </div>
      <span className="block text-sm font-semibold text-slate-700 mt-1 break-words">
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

function ProfileSection({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-800 font-outfit">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const patientCode = params?.patient_code;
  const [patient, setPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [prescriptionsLoading, setPrescriptionsLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const triggerToast = (msg, type = "error") => {
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

  const getPatientName = (record) => {
    return [record?.first_name, record?.middle_name, record?.last_name]
      .filter(Boolean)
      .join(" ") || "Unnamed Patient";
  };

  const getDoctorName = (record) => {
    const name = record?.doctor_name || record?.doctor?.name;
    if (!name) return "Not available";
    return name.trim().toLowerCase().startsWith("dr.") ? name : `Dr. ${name}`;
  };

  const loadPrescriptionDetail = useCallback(async (prescription) => {
    if (!prescription?.id) return;
    setSelectedPrescription(prescription);
    setDetailLoading(true);

    try {
      const { data } = await api.get(`/prescriptions/${prescription.id}`);
      if (data.status === false) {
        throw new Error(data.message || "Failed to fetch prescription.");
      }

      setSelectedPrescription(data.data || prescription);
    } catch (error) {
      triggerToast(error.message || "Unable to load prescription.");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  const loadPatient = useCallback(async () => {
    if (!patientCode) return;
    setLoading(true);
    setPrescriptionsLoading(true);

    try {
      const [patientResponse, prescriptionsResponse] = await Promise.all([
        api.get(`/patients/${patientCode}`),
        api.get("/prescriptions", {
          params: { patient_code: patientCode, sort: "oldest" },
        }),
      ]);

      const patientData = patientResponse.data;
      const prescriptionsData = prescriptionsResponse.data;

      if (patientData.status === false) {
        throw new Error(patientData.message || "Failed to fetch patient.");
      }

      if (prescriptionsData.status === false) {
        throw new Error(prescriptionsData.message || "Failed to fetch prescriptions.");
      }

      const list = prescriptionsData.data || [];
      setPatient(patientData.data || null);
      setPrescriptions(list);

      if (list.length > 0) {
        const latest = [...list].sort((a, b) => {
          return new Date(b.prescription_date || b.created_at || 0) - new Date(a.prescription_date || a.created_at || 0);
        })[0];
        await loadPrescriptionDetail(latest);
      }
    } catch (error) {
      triggerToast(error.message || "Unable to load patient data.");
    } finally {
      setLoading(false);
      setPrescriptionsLoading(false);
    }
  }, [loadPrescriptionDetail, patientCode]);

  const deletePatient = async () => {
    if (!patientCode) return;
    setDeleteLoading(true);

    try {
      const { data } = await api.delete(`/patients/${patientCode}`);
      if (data.status === false) {
        throw new Error(data.message || "Failed to delete patient.");
      }

      triggerToast(data.message || "Patient deleted successfully.", "success");
      setDeleteConfirmOpen(false);
      setTimeout(() => {
        router.push("/dashboard/patients");
      }, 650);
    } catch (error) {
      triggerToast(error.message || "Unable to delete patient.");
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    queueMicrotask(() => {
      loadPatient();
    });
  }, [loadPatient]);

  const vitals = useMemo(() => ([
    ["Temperature", selectedPrescription?.temperature],
    ["Height", selectedPrescription?.height],
    ["Weight", selectedPrescription?.weight],
    ["Pulse", selectedPrescription?.pulse],
    ["Blood Pressure", selectedPrescription?.blood_pressure],
    ["Blood Sugar", selectedPrescription?.blood_sugar],
    ["Hemoglobin", selectedPrescription?.hemoglobin],
    ["SPO2", selectedPrescription?.spo2],
    ["Respiration Rate", selectedPrescription?.respiration_rate],
  ]), [selectedPrescription]);

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold border ${
          toastMessage.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-rose-50 border-rose-200 text-rose-800"
        }`}>
          <AlertCircle className="h-5 w-5" />
          {toastMessage.text}
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center text-sm font-semibold text-slate-400">
          Loading patient profile...
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5 border-b border-slate-100 pb-5">
              <div>
                <div className="inline-flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                  <UserRound className="h-3.5 w-3.5" />
                  {patient?.patient_code || patientCode}
                </div>
                <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-slate-800 font-outfit">
                  {getPatientName(patient)}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {patient?.gender || "Unknown"} | {patient?.age || "-"} yrs | Registered {formatDate(patient?.created_at)}
                </p>
              </div>
              <div className="flex flex-wrap justify-start lg:justify-end gap-2">
                <span className="inline-flex items-center gap-1 rounded-lg border border-rose-100 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
                  <Droplet className="h-3.5 w-3.5" />
                  {patient?.blood_group || "N/A"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  <FileText className="h-3.5 w-3.5" />
                  {prescriptions.length} prescriptions
                </span>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 focus:outline-none"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Patient
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_360px] gap-4">
              <div className="space-y-4">
                <ProfileSection title="Patient Contact" subtitle="Primary contact and demographic details.">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <InfoTile label="Email" value={patient?.email} icon={Mail} />
                    <InfoTile label="Phone" value={patient?.phone} icon={Phone} />
                    <InfoTile label="Birth Date" value={formatDate(patient?.date_of_birth)} icon={Calendar} />
                  </div>
                </ProfileSection>

                <ProfileSection title="Residential Details" subtitle="Address information kept separate for easier scanning.">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <InfoTile label="Address" value={patient?.street_address} icon={MapPin} />
                    <InfoTile label="City / State" value={[patient?.city, patient?.state].filter(Boolean).join(", ")} icon={MapPin} />
                    <InfoTile label="ZIP Code" value={patient?.zip_code} icon={MapPin} />
                  </div>
                </ProfileSection>
              </div>

              <ProfileSection title="Doctor & Registry" subtitle="Care owner and creation metadata.">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-3">
                  <InfoTile label="Doctor" value={getDoctorName(patient)} icon={Stethoscope} />
                  <InfoTile label="Doctor Code" value={patient?.doctor_code} icon={Stethoscope} />
                  <InfoTile label="Created By" value={patient?.created_by_name} icon={UserRound} />
                  <InfoTile label="Created At" value={formatDate(patient?.created_at)} icon={Calendar} />
                </div>
              </ProfileSection>
            </div>
          </section>

          {deleteConfirmOpen && (
            <section className="rounded-2xl border border-rose-200 bg-rose-50 p-5 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-white text-rose-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-rose-800 font-outfit">Delete this patient?</h3>
                    <p className="mt-1 text-xs text-rose-600">
                      This will remove {getPatientName(patient)} from the patient registry.
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
                    onClick={deletePatient}
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

          <section className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                <h3 className="text-sm font-bold text-slate-800 font-outfit">Full Prescription List</h3>
                <p className="mt-0.5 text-xs text-slate-400">Click any prescription to view complete data.</p>
              </div>
              <div className={`${prescriptions.length > 10 ? "admin-scroll-panel" : ""} p-4 space-y-3`}>
                {prescriptionsLoading ? (
                  <div className="py-10 text-center text-xs font-semibold text-slate-400">Loading prescriptions...</div>
                ) : prescriptions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-400">
                    No prescriptions found.
                  </div>
                ) : (
                  prescriptions.map((prescription) => (
                    <button
                      key={prescription.id}
                      type="button"
                      onClick={() => loadPrescriptionDetail(prescription)}
                      className={`w-full text-left rounded-xl border p-4 transition-all focus:outline-none ${
                        selectedPrescription?.id === prescription.id
                          ? "border-primary bg-primary/5"
                          : "border-slate-200 bg-white hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="block text-sm font-bold text-slate-800 truncate">
                            {prescription.diagnosis || "Diagnosis not added"}
                          </span>
                          <span className="block text-xs text-slate-400 mt-1 truncate">
                            {prescription.chief_complaint || "No complaint"}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 shrink-0">
                          {formatDate(prescription.prescription_date)}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
                <h3 className="text-sm font-bold text-slate-800 font-outfit">Prescription Detail</h3>
                <p className="mt-0.5 text-xs text-slate-400">Vitals, case history, advice, medicines, and tests.</p>
              </div>

              {detailLoading ? (
                <div className="py-20 text-center text-xs font-semibold text-slate-400">
                  Loading prescription detail...
                </div>
              ) : !selectedPrescription ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Select a prescription from the list.
                </div>
              ) : (
                <div className="p-5 md:p-6 space-y-6">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <h4 className="text-xl font-bold text-slate-800 font-outfit">
                        {selectedPrescription.diagnosis || "Prescription"}
                      </h4>
                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(selectedPrescription.prescription_date)} | Dr. {selectedPrescription.doctor_name || "Not available"}
                      </p>
                    </div>
                    <InfoTile label="Follow Up" value={formatDate(selectedPrescription.follow_up_date)} icon={Calendar} />
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {vitals.map(([label, value]) => (
                      <InfoTile key={label} label={label} value={value} />
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <DetailBlock label="Allergy" value={selectedPrescription.allergy} icon={AlertCircle} />
                    <DetailBlock label="Chief Complaint" value={selectedPrescription.chief_complaint} icon={ClipboardList} />
                    <DetailBlock label="History" value={selectedPrescription.history} icon={ClipboardList} />
                    <DetailBlock label="Findings" value={selectedPrescription.findings} icon={ClipboardList} />
                    <DetailBlock label="Treatment Advice" value={selectedPrescription.treatment_advice} icon={FileText} />
                    <DetailBlock label="End Note" value={selectedPrescription.end_note} icon={FileText} />
                    <DetailBlock label="Internal Notes" value={selectedPrescription.notes} icon={FileText} />
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Medicines</h5>
                    {(selectedPrescription.medicines || []).length === 0 ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-400">No medicines added.</div>
                    ) : (
                      selectedPrescription.medicines.map((medicine) => (
                        <div key={medicine.id || medicine.name} className="rounded-xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="font-semibold text-slate-800">{medicine.name || "Medicine"}</span>
                            <span className="text-xs text-slate-400">{medicine.total_quantity || "-"} qty | {medicine.no_of_days || "-"} days</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            {[medicine.frequency, medicine.route_form, medicine.instructions].filter(Boolean).join(" | ") || "Instructions not available"}
                          </p>
                          {medicine.additional_comments && (
                            <p className="text-xs text-slate-400 mt-1">{medicine.additional_comments}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lab Tests</h5>
                    {(selectedPrescription.lab_tests || []).length === 0 ? (
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-400">No lab tests added.</div>
                    ) : (
                      selectedPrescription.lab_tests.map((test) => (
                        <div key={test.id || test.test_name} className="rounded-xl border border-slate-200 bg-white p-4">
                          <span className="font-semibold text-slate-800">{test.test_name || "Lab test"}</span>
                          {test.additional_comments && (
                            <p className="text-xs text-slate-400 mt-1">{test.additional_comments}</p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
