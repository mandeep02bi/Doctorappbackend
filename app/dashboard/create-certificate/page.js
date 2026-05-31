"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import api from "@/utils/api";
import {
  AlertCircle,
  Beaker,
  CheckCircle,
  FileText,
  Mail,
  NotebookPen,
  Pencil,
  Phone,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

const templateTabs = [
  {
    id: "Medicine",
    label: "Medicine",
    titlePlaceholder: "Tab Paracetamol 500mg",
    icon: Sparkles,
  },
  {
    id: "Lab Test",
    label: "Lab Test",
    titlePlaceholder: "CBC Blood Test",
    icon: Beaker,
  },
  {
    id: "Instruction",
    label: "Instruction",
    titlePlaceholder: "Epley Maneuver",
    contentPlaceholder: "Add step-by-step instruction template content...",
    icon: NotebookPen,
  },
];

const emptyForms = {
  Medicine: {
    title: "",
    total_quantity: "",
    frequency: "",
    route_form: "",
    no_of_days: "",
    instructions: "",
    additional_comments: "",
  },
  "Lab Test": { title: "", content: "" },
  Instruction: { title: "", content: "" },
};

const frequencies = [
  "1-0-0",
  "0-1-0",
  "0-0-1",
  "1-1-0",
  "1-0-1",
  "0-1-1",
  "1-1-1",
  "1-1-1-1",
  "Once a day",
  "Twice a day",
  "Thrice a day",
  "Every 6 hours",
  "As needed",
];

const routes = [
  "Oral",
  "Topical",
  "Nasal",
  "IV",
  "IM",
  "Sublingual",
  "Inhaler",
  "Eye drops",
  "Ear drops",
  "Nebulization",
];

const instructionsList = [
  "Before food",
  "After food",
  "With food",
  "Empty stomach",
  "Before sleep",
  "With warm water",
  "With milk",
  "As directed",
  "Apply locally",
];

function FormField({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  textarea = false,
  selectOptions = null,
  placeholder = "",
}) {
  const className = `w-full rounded-xl border px-3 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 ${
    error ? "border-rose-300 bg-rose-50/40" : "border-slate-200 bg-white focus:border-primary"
  }`;

  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1 text-xs font-semibold text-slate-500">
        {label}
        {required && <span className="text-rose-500">*</span>}
      </span>
      {textarea ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={6}
          className={`${className} resize-y leading-relaxed`}
        />
      ) : selectOptions ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          className={className}
        >
          <option value="">{placeholder || `Select ${label}`}</option>
          {selectOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : (
        <input
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={className}
        />
      )}
      {error && <span className="mt-1 block text-[11px] font-semibold text-rose-600">{error}</span>}
    </label>
  );
}

function parseTemplateContent(content) {
  if (!content) return "No content available.";
  if (typeof content === "object") {
    if (content?.description) return content.description;
    return JSON.stringify(content, null, 2);
  }

  try {
    const parsed = JSON.parse(content);
    if (typeof parsed === "string") return parsed;
    if (parsed?.description) return parsed.description;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return content;
  }
}

function readTemplateContent(content) {
  if (!content) return null;
  if (typeof content === "object") return content;

  try {
    return JSON.parse(content);
  } catch {
    return content;
  }
}

function normalizeMedicineContent(content) {
  const parsed = readTemplateContent(content);
  if (Array.isArray(parsed)) return parsed[0] || {};
  if (parsed?.description) {
    const nested = readTemplateContent(parsed.description);
    if (Array.isArray(nested)) return nested[0] || {};
    if (nested && typeof nested === "object") return nested;
  }
  if (parsed && typeof parsed === "object") return parsed;
  return {};
}

function buildContentSummary(template) {
  const parsed = readTemplateContent(template?.content);

  if (template?.type === "Medicine") {
    const item = Array.isArray(parsed) ? parsed[0] : parsed;
    return [
      item?.total_quantity ? `Qty ${item.total_quantity}` : null,
      item?.frequency,
      item?.route_form,
      item?.no_of_days ? `${item.no_of_days} days` : null,
    ].filter(Boolean).join(" | ") || "Medicine details not added.";
  }

  if (template?.type === "Lab Test") {
    const comment = parsed?.additional_comments || parsed?.description || parsed;
    return typeof comment === "string" && comment ? comment : "No additional comments.";
  }

  return parseTemplateContent(template?.content);
}

function TemplateContentDetail({ template }) {
  const parsed = readTemplateContent(template?.content);

  if (template?.type === "Medicine") {
    const medicines = Array.isArray(parsed) ? parsed : [parsed || {}];

    return (
      <div className="space-y-3">
        {medicines.map((medicine, index) => (
          <div key={index} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ["Total Qty", medicine?.total_quantity],
                ["Frequency", medicine?.frequency],
                ["Route / Form", medicine?.route_form],
                ["No. of Days", medicine?.no_of_days],
                ["Instruction", medicine?.instructions],
                ["Comments", medicine?.additional_comments],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg border border-slate-200 bg-white p-3 shadow-[0_1px_0_rgba(15,23,42,0.03)]">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {label}
                  </span>
                  <span className="mt-1 block text-sm font-semibold text-slate-700 break-words">
                    {value || "Not available"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (template?.type === "Lab Test") {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
        <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
          {parsed?.additional_comments || parsed?.description || parsed || "No additional comments."}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-700">
        {parseTemplateContent(template?.content)}
      </p>
    </div>
  );
}

function getTemplateId(template) {
  return template?.id || template?.template_id || template?._id;
}

function fieldValue(value) {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function readDoctorCodes(template) {
  const value = template?.doctor_code;
  if (!value) return [];
  if (Array.isArray(value)) return value.map((code) => String(code).trim()).filter(Boolean).slice(0, 1);
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((code) => String(code).trim()).filter(Boolean).slice(0, 1);
      }
    } catch {
      return value.split(",").map((code) => code.trim()).filter(Boolean).slice(0, 1);
    }
  }
  return [];
}

function getDoctorCode(doctor) {
  return doctor?.doctor_code || doctor?.user_code || doctor?.id || doctor?._id;
}

function getDoctorName(doctor) {
  return [doctor?.first_name, doctor?.last_name].filter(Boolean).join(" ") || doctor?.name || "Unnamed Doctor";
}

function getDoctorEmail(doctor) {
  return doctor?.email || doctor?.email_address || "No email";
}

function getDoctorPhone(doctor) {
  return doctor?.phone || doctor?.mobile_number || doctor?.phone_number || doctor?.mobile || "No phone";
}

function buildDoctorCodePayload(codes) {
  return codes.map((code) => String(code).trim()).filter(Boolean).slice(0, 1).join(",");
}

export default function CreateCertificatePage() {
  const [activeType, setActiveType] = useState("Medicine");
  const [forms, setForms] = useState(emptyForms);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [errors, setErrors] = useState({});
  const [listLoading, setListLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [mobileDetailOpen, setMobileDetailOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");
  const [selectedDoctorCodes, setSelectedDoctorCodes] = useState([]);

  const activeConfig = useMemo(
    () => templateTabs.find((tab) => tab.id === activeType),
    [activeType],
  );
  const form = forms[activeType];

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

  const loadDoctors = useCallback(async () => {
    setDoctorsLoading(true);

    try {
      const { data } = await api.get("/admin/users");
      if (data.status === false) {
        throw new Error(data.message || "Unable to fetch doctors.");
      }

      const doctorUsers = (data?.data || []).filter((user) => user.role === "Doctor");
      setDoctors(doctorUsers);
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]);
      triggerToast(error.message || "Unable to fetch doctors.", "error");
    } finally {
      setDoctorsLoading(false);
    }
  }, []);

  const loadTemplates = useCallback(async (type) => {
    setListLoading(true);

    try {
      const { data } = await api.get("/templates", {
        params: { type },
      });
      if (data.status === false) {
        throw new Error(data.message || "Unable to fetch templates.");
      }

      setTemplates(data.data || []);
    } catch (error) {
      setTemplates([]);
      triggerToast(error.message || "Unable to fetch templates.", "error");
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadTemplateDetail = useCallback(async (template) => {
    const templateId = getTemplateId(template);
    if (!templateId) return;
    setSelectedTemplate(template);
    setDeleteConfirmOpen(false);
    setMobileDetailOpen(true);
    setDetailLoading(true);

    try {
      const { data } = await api.get(`/templates/${templateId}`);
      if (data.status === false) {
        throw new Error(data.message || "Template not found.");
      }

      setSelectedTemplate(data.data || template);
    } catch (error) {
      triggerToast(error.message || "Unable to fetch template detail.", "error");
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      loadTemplates(activeType);
    });
  }, [activeType, loadTemplates]);

  useEffect(() => {
    if (selectedTemplate && readDoctorCodes(selectedTemplate).length > 0 && doctors.length === 0 && !doctorsLoading) {
      queueMicrotask(() => {
        loadDoctors();
      });
    }
  }, [selectedTemplate, doctors.length, doctorsLoading, loadDoctors]);

  const filteredDoctors = useMemo(() => {
    const query = doctorSearch.trim().toLowerCase();
    if (!query) return doctors;

    return doctors.filter((doctor) =>
      [
        getDoctorCode(doctor),
        getDoctorName(doctor),
        getDoctorEmail(doctor),
        getDoctorPhone(doctor),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [doctorSearch, doctors]);

  const selectedDoctors = useMemo(
    () => doctors.filter((doctor) => selectedDoctorCodes.includes(getDoctorCode(doctor))),
    [doctors, selectedDoctorCodes]
  );

  const doctorsByCode = useMemo(
    () => new Map(doctors.map((doctor) => [getDoctorCode(doctor), doctor]).filter(([doctorCode]) => doctorCode)),
    [doctors]
  );

  const updateField = (event) => {
    const { name, value } = event.target;
    setForms((current) => ({
      ...current,
      [activeType]: {
        ...current[activeType],
        [name]: value,
      },
    }));
    setErrors((current) => {
      const next = { ...current };
      delete next[name];
      return next;
    });
  };

  const resetActiveForm = () => {
    setForms((current) => ({
      ...current,
      [activeType]: { ...emptyForms[activeType] },
    }));
    setEditingTemplateId(null);
    setSelectedDoctorCodes([]);
    setErrors({});
  };

  const startEditTemplate = () => {
    const templateId = getTemplateId(selectedTemplate);
    if (!templateId) return;

    const templateType = selectedTemplate.type || activeType;
    const medicineContent = normalizeMedicineContent(selectedTemplate.content);
    const labContent = readTemplateContent(selectedTemplate.content);
    if (templateType !== activeType) {
      setActiveType(templateType);
    }

    setForms((current) => ({
      ...current,
      [templateType]:
        templateType === "Medicine"
          ? {
              title: selectedTemplate.title || medicineContent?.name || "",
              total_quantity: medicineContent?.total_quantity || "",
              frequency: medicineContent?.frequency || "",
              route_form: medicineContent?.route_form || "",
              no_of_days: medicineContent?.no_of_days || "",
              instructions: medicineContent?.instructions || "",
              additional_comments: medicineContent?.additional_comments || "",
            }
          : templateType === "Lab Test"
            ? {
                title: selectedTemplate.title || labContent?.test_name || "",
                content: labContent?.additional_comments || labContent?.description || "",
              }
            : {
                title: selectedTemplate.title || "",
                content: parseTemplateContent(selectedTemplate.content),
              },
    }));
    setEditingTemplateId(templateId);
    setSelectedDoctorCodes(readDoctorCodes(selectedTemplate));
    setMobileDetailOpen(false);
    setErrors({});
    triggerToast("Template loaded. Update fields, then confirm doctor.");
  };

  const validateForm = () => {
    const nextErrors = {};
    const data = forms[activeType] || emptyForms[activeType] || {};

    if (!fieldValue(data.title).trim()) {
      nextErrors.title = "Title is required.";
    } else if (fieldValue(data.title).trim().length < 3) {
      nextErrors.title = "Title must be at least 3 characters.";
    }

    if (activeType === "Medicine") {
      if (!fieldValue(data.total_quantity).trim()) nextErrors.total_quantity = "Quantity is required.";
      if (!fieldValue(data.frequency).trim()) nextErrors.frequency = "Frequency is required.";
      if (!fieldValue(data.route_form).trim()) nextErrors.route_form = "Route/Form is required.";
      if (!fieldValue(data.no_of_days).trim()) nextErrors.no_of_days = "No. of days is required.";
      if (!fieldValue(data.instructions).trim()) nextErrors.instructions = "Instruction is required.";
    } else if (activeType === "Instruction") {
      if (!fieldValue(data.content).trim()) {
        nextErrors.content = "Description is required.";
      } else if (fieldValue(data.content).trim().length < 5) {
        nextErrors.content = "Description must be at least 5 characters.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const openDoctorSelection = async (doctorCodes = selectedDoctorCodes) => {
    setSelectedDoctorCodes(doctorCodes.map((code) => String(code).trim()).filter(Boolean).slice(0, 1));
    setDoctorModalOpen(true);
    setDoctorSearch("");

    if (doctors.length === 0) {
      await loadDoctors();
    }
  };

  const toggleDoctor = (doctorCode) => {
    if (!doctorCode) return;
    setSelectedDoctorCodes((current) => (current.includes(doctorCode) ? [] : [doctorCode]));
  };

  const confirmDoctorSelection = () => {
    if (selectedDoctorCodes.length === 0) {
      triggerToast("Please select a doctor.", "error");
      return;
    }

    setDoctorModalOpen(false);
    triggerToast("Doctor selected.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      triggerToast("Please fix highlighted fields.", "error");
      return;
    }

    if (selectedDoctorCodes.length === 0) {
      triggerToast("Please choose a doctor.", "error");
      await openDoctorSelection();
      return;
    }

    setSubmitting(true);

    try {
      const contentByType = {
        Medicine: {
          total_quantity: fieldValue(form.total_quantity).trim(),

          frequency: fieldValue(form.frequency).trim(),

          route_form: fieldValue(form.route_form).trim(),

          no_of_days: fieldValue(form.no_of_days).trim(),

          instructions: fieldValue(form.instructions).trim(),
          
          additional_comments: fieldValue(form.additional_comments).trim() || null,
        },
        "Lab Test": {
          additional_comments: fieldValue(form.content).trim() || null,
        },
        Instruction: { description: fieldValue(form.content).trim() },
      };

      const payload = {
        
        type: activeType,
        title: fieldValue(form.title).trim(),
        doctor_code: buildDoctorCodePayload(selectedDoctorCodes),
        content:  JSON.stringify(contentByType[activeType]),
      };
      console.log("payload:",payload);

      const request = editingTemplateId
        ? api.put(`/templates/${editingTemplateId}`, payload)
        : api.post("/templates", payload);

      const { data } = await request;
      if (data.status === false) {
        throw new Error(data.message || (editingTemplateId ? "Template update failed." : "Template create failed."));
      }

      triggerToast(data.message || (editingTemplateId ? "Template updated" : "Template created"));

      const savedTemplateId = editingTemplateId || getTemplateId(data?.data);
      
      resetActiveForm();
      
      await loadTemplates(activeType);

      if (savedTemplateId) {
        await loadTemplateDetail({ id: savedTemplateId });
      }
    } catch (error) {
      console.log("FULL ERROR:", error);
  console.log("SERVER ERROR:", error?.response?.data);
  console.log("STATUS:", error?.response?.status);

  triggerToast(
    error?.response?.data?.message ||
    error?.message ||
    "Request failed",
    "error"
  );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTemplate = async () => {
    const templateId = getTemplateId(selectedTemplate);
    if (!templateId) return;

    setDeleteLoading(true);

    try {
      const { data } = await api.delete(`/templates/${templateId}`);
      if (data?.status === false) {
        throw new Error(data.message || "Template delete failed.");
      }

      triggerToast(data.message || "Template deleted");
      setSelectedTemplate(null);
      setDeleteConfirmOpen(false);
      setMobileDetailOpen(false);
      if (editingTemplateId === templateId) {
        resetActiveForm();
      }
      await loadTemplates(activeType);
    } catch (error) {
      triggerToast(error.message || "Unable to delete template.", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const renderTemplateDetail = ({ showClose = false } = {}) => {
    if (detailLoading) {
      return (
        <div className="py-20 text-center text-xs font-semibold text-slate-400">
          Loading template detail...
        </div>
      );
    }

    if (!selectedTemplate) {
      return (
        <div className="p-8 text-center">
          <FileText className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-xs font-semibold text-slate-500">
            Select any {activeType} template from the list.
          </p>
        </div>
      );
    }

    const assignedDoctorCodes = readDoctorCodes(selectedTemplate);

    return (
      <div className="p-5 md:p-6 space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-5">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="min-w-0">
              <span className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                {selectedTemplate.type}
              </span>
              <h4 className="mt-3 text-2xl md:text-3xl font-bold text-slate-800 font-outfit break-words">
                {selectedTemplate.title || "Untitled template"}
              </h4>
              <p className="mt-1 text-xs text-slate-400">
                {selectedTemplate.type === "Medicine"
                  ? "Medicine template"
                  : selectedTemplate.type === "Lab Test"
                    ? "Lab test template"
                    : "Instruction template"}
                {selectedTemplate.created_by_name ? ` by ${selectedTemplate.created_by_name}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-start lg:justify-end gap-2">
              {showClose && (
                <button
                  type="button"
                  onClick={() => setMobileDetailOpen(false)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 focus:outline-none"
                >
                  <X className="h-4 w-4" />
                  Close
                </button>
              )}
              <button
                type="button"
                onClick={startEditTemplate}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/15 focus:outline-none"
              >
                <Pencil className="h-4 w-4" />
                Update Template
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={deleteLoading}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100 focus:outline-none disabled:opacity-60"
              >
                {deleteLoading ? (
                  <span className="h-4 w-4 rounded-full border-2 border-rose-200 border-t-rose-600 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Delete Template
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {selectedTemplate.type === "Medicine" ? "Medicine Details" : selectedTemplate.type === "Lab Test" ? "Additional Comments" : "Description"}
          </span>
          <div className="mt-3">
            <TemplateContentDetail template={selectedTemplate} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Doctor
          </span>
          <div className="mt-3 flex flex-wrap gap-2">
            {assignedDoctorCodes.length === 0 ? (
              <span className="text-xs font-semibold text-slate-400">No doctor assigned.</span>
            ) : doctorsLoading && doctors.length === 0 ? (
              <span className="text-xs font-semibold text-slate-400">Loading doctor...</span>
            ) : (
              assignedDoctorCodes.map((doctorCode) => {
                const doctor = doctorsByCode.get(doctorCode);
                return (
                  <Link
                    key={doctorCode}
                    href={`/dashboard/doctors/${doctor?.user_code || doctorCode}`}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-700 transition-colors hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                  >
                    <UserRound className="h-3.5 w-3.5" />
                    Dr. {doctor ? getDoctorName(doctor) : doctorCode}
                  </Link>
                );
              })
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4 text-[11px] font-semibold text-slate-500">
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1">
            Created {formatDate(selectedTemplate.created_at)}
          </span>
          <span className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1">
            Updated {formatDate(selectedTemplate.updated_at)}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-xl flex items-center gap-2 text-sm font-semibold border ${
          toastMessage.type === "error"
            ? "bg-rose-50 border-rose-200 text-rose-800"
            : "bg-emerald-50 border-emerald-200 text-emerald-800"
        }`}>
          {toastMessage.type === "error" ? <AlertCircle className="h-5 w-5" /> : <CheckCircle className="h-5 w-5" />}
          {toastMessage.text}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 font-outfit">
            Create Templates
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage reusable templates for Medicine, Lab Test, and Instruction.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadTemplates(activeType)}
          disabled={listLoading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 focus:outline-none disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${listLoading ? "animate-spin" : ""}`} />
          Refresh {activeType}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6">
        <aside className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm h-fit">
          <div className="px-2 py-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Template Type
            </span>
          </div>
          <div className="space-y-2">
            {templateTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeType === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveType(tab.id);
                    setSelectedTemplate(null);
                    setMobileDetailOpen(false);
                    setErrors({});
                  }}
                  className={`w-full rounded-xl px-3 py-3 text-left text-sm font-semibold transition-all focus:outline-none flex items-center gap-3 ${
                    isActive
                      ? "bg-primary text-white shadow-md shadow-primary/15"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                {React.createElement(activeConfig.icon, { className: "h-5 w-5" })}
              </div>
              <div>
                  <h3 className="text-base font-bold text-slate-800 font-outfit">
                  {editingTemplateId ? "Update" : "Create"} {activeType} Template
                </h3>
                <p className="text-xs text-slate-400">
                  {editingTemplateId ? `Editing template #${editingTemplateId}.` : "Add structured template data for quick prescription reuse."}
                </p>
              </div>
            </div>

            <div className="p-5 md:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-[180px_minmax(0,1fr)] gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Type
                  </span>
                  <div className="mt-2 flex items-center gap-2 text-sm font-bold text-slate-800">
                    {React.createElement(activeConfig.icon, { className: "h-4 w-4 text-primary" })}
                    {activeType}
                  </div>
                </div>
                <FormField
                  label={activeType === "Medicine" ? "Medicine Name" : activeType === "Lab Test" ? "Test Name" : "Title"}
                  name="title"
                  value={form.title}
                  onChange={updateField}
                  error={errors.title}
                  required
                  placeholder={activeConfig.titlePlaceholder}
                />
              </div>

              {activeType === "Medicine" ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 md:p-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      label="Total Qty"
                      name="total_quantity"
                      value={form.total_quantity}
                      onChange={updateField}
                      error={errors.total_quantity}
                      required
                      placeholder="10"
                    />
                    <FormField
                      label="No. of Days"
                      name="no_of_days"
                      value={form.no_of_days}
                      onChange={updateField}
                      error={errors.no_of_days}
                      required
                      placeholder="5"
                    />
                    <FormField
                      label="Frequency"
                      name="frequency"
                      value={form.frequency}
                      onChange={updateField}
                      error={errors.frequency}
                      required
                      selectOptions={frequencies}
                      placeholder="Select frequency"
                    />
                    <FormField
                      label="Route / Form"
                      name="route_form"
                      value={form.route_form}
                      onChange={updateField}
                      error={errors.route_form}
                      required
                      selectOptions={routes}
                      placeholder="Select route"
                    />
                    <FormField
                      label="Instruction"
                      name="instructions"
                      value={form.instructions}
                      onChange={updateField}
                      error={errors.instructions}
                      required
                      selectOptions={instructionsList}
                      placeholder="Select instruction"
                    />
                    <FormField
                      label="Additional Comments"
                      name="additional_comments"
                      value={form.additional_comments}
                      onChange={updateField}
                      error={errors.additional_comments}
                      placeholder="If fever persists"
                    />
                  </div>
                </div>
              ) : activeType === "Lab Test" ? (
                <FormField
                  label="Additional Comments"
                  name="content"
                  value={form.content}
                  onChange={updateField}
                  error={errors.content}
                  textarea
                  placeholder="Preparation notes, fasting requirement, or remarks..."
                />
              ) : (
                <FormField
                  label="Description"
                  name="content"
                  value={form.content}
                  onChange={updateField}
                  error={errors.content}
                  required
                  textarea
                  placeholder={activeConfig.contentPlaceholder}
                />
              )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 flex flex-col sm:flex-row justify-end gap-3">
              {editingTemplateId && (
                <button
                  type="button"
                  onClick={resetActiveForm}
                  disabled={submitting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50 focus:outline-none disabled:opacity-60"
                >
                  <X className="h-4 w-4" />
                  Cancel Edit
                </button>
              )}
              <button
                type="button"
                onClick={() => openDoctorSelection()}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary shadow-sm hover:bg-primary/15 focus:outline-none disabled:opacity-60"
              >
                <UserRound className="h-4 w-4" />
                Doctor {selectedDoctorCodes.length > 0 ? "(1)" : ""}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/15 hover:bg-primary-hover focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {editingTemplateId ? "Update Template" : "Create Template"}
              </button>
            </div>
          </form>

          <section className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-slate-100 bg-slate-50 px-5 py-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 font-outfit">
                    {activeType} Templates
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Select any template to view full details.
                  </p>
                </div>
                <span className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-500">
                  {templates.length}
                </span>
              </div>

              <div className="max-h-[560px] overflow-y-auto p-4 space-y-3">
                {listLoading ? (
                  <div className="py-10 text-center text-xs font-semibold text-slate-400">
                    Loading {activeType} templates...
                  </div>
                ) : templates.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center">
                    <FileText className="mx-auto h-9 w-9 text-slate-300" />
                    <p className="mt-3 text-xs font-semibold text-slate-500">
                      No {activeType} templates found.
                    </p>
                  </div>
                ) : (
                  templates.map((template) => (
                    (() => {
                      const templateId = getTemplateId(template);
                      return (
                    <button
                      key={templateId}
                      type="button"
                      onClick={() => loadTemplateDetail(template)}
                      className={`w-full text-left rounded-xl border p-4 transition-all focus:outline-none ${
                        getTemplateId(selectedTemplate) === templateId
                          ? "border-primary bg-primary/5"
                          : "border-slate-200 bg-white hover:border-primary/40 hover:bg-slate-50"
                      }`}
                    >
                      <div className="min-w-0">
                          <span className="block text-sm font-bold text-slate-800 truncate">
                            {template.title || "Untitled template"}
                          </span>
                          <span className="mt-1 block text-xs text-slate-400 truncate">
                            {buildContentSummary(template)}
                          </span>
                      </div>
                    </button>
                      );
                    })()
                  ))
                )}
              </div>
            </div>

            <div className="hidden xl:block rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              {renderTemplateDetail()}
            </div>
          </section>

          {mobileDetailOpen && (
            <div className="fixed inset-0 z-50 xl:hidden">
              <button
                type="button"
                aria-label="Close template detail"
                onClick={() => setMobileDetailOpen(false)}
                className="absolute inset-0 bg-slate-950/60"
              />
              <div className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-3xl border border-slate-200 bg-white shadow-2xl">
                {renderTemplateDetail({ showClose: true })}
              </div>
            </div>
          )}

          {deleteConfirmOpen && selectedTemplate && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
              <button
                type="button"
                aria-label="Close delete confirmation"
                onClick={() => setDeleteConfirmOpen(false)}
                className="absolute inset-0 bg-slate-950/60"
              />
              <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-2xl">
                <div className="h-1.5 bg-rose-500" />
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50 text-rose-600">
                      <Trash2 className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-slate-800 font-outfit">
                        Delete template?
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">
                        Are you sure you want to delete{" "}
                        <span className="font-semibold text-slate-700">
                          {selectedTemplate.title || "this template"}
                        </span>
                        ? This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmOpen(false)}
                      disabled={deleteLoading}
                      className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 focus:outline-none disabled:opacity-60"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteTemplate}
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
              </div>
            </div>
          )}
        </div>
      </div>

      {doctorModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button type="button" aria-label="Close doctor selection" onClick={() => setDoctorModalOpen(false)} className="absolute inset-0 bg-slate-950/60" />
          <div className="relative flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 font-outfit">Choose Doctor</h3>
                </div>
                <button type="button" onClick={() => setDoctorModalOpen(false)} className="rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 focus:outline-none">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {selectedDoctors.length > 0 && (
                <div className="mt-4 flex max-h-20 flex-wrap gap-2 overflow-y-auto">
                  {selectedDoctors.map((doctor) => (
                    <button
                      key={getDoctorCode(doctor)}
                      type="button"
                      onClick={() => toggleDoctor(getDoctorCode(doctor))}
                      className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary"
                    >
                      Dr. {getDoctorName(doctor)}
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}

              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={doctorSearch}
                  onChange={(event) => setDoctorSearch(event.target.value)}
                  placeholder="Search doctors by name, email, or phone..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>

            <div className="admin-scroll-panel min-h-0 flex-1 overflow-y-auto p-4 space-y-3">
              {doctorsLoading ? (
                <div className="py-10 text-center text-xs font-semibold text-slate-400">Loading doctors...</div>
              ) : filteredDoctors.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center text-xs font-semibold text-slate-400">
                  No doctors found.
                </div>
              ) : (
                filteredDoctors.map((doctor) => {
                  const doctorCode = getDoctorCode(doctor);
                  const checked = selectedDoctorCodes.includes(doctorCode);
                  const codeMissing = !doctorCode;

                  return (
                    <label key={doctorCode || doctor.user_code} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all ${
                      checked ? "border-primary bg-primary/5" : "border-slate-200 bg-white hover:border-primary/40"
                    }`}>
                      <input
                        type="radio"
                        checked={checked}
                        disabled={codeMissing}
                        onChange={() => toggleDoctor(doctorCode)}
                        className="mt-1 h-4 w-4 rounded-full border-slate-300 text-primary focus:ring-primary disabled:opacity-40"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <span className="truncate text-sm font-bold text-slate-800">Dr. {getDoctorName(doctor)}</span>
                          {codeMissing && <span className="text-xs font-semibold text-rose-500">Doctor code missing</span>}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            {getDoctorEmail(doctor)}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            {getDoctorPhone(doctor)}
                          </span>
                        </div>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-xs font-semibold text-slate-500">
                {selectedDoctorCodes.length === 1 ? "1 doctor selected" : "No doctor selected"}
              </span>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setDoctorModalOpen(false)} disabled={submitting} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-60">
                  Cancel
                </button>
                <button type="button" onClick={confirmDoctorSelection} disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-hover disabled:opacity-60">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
