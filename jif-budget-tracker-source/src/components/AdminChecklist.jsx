import { useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDashed, ClipboardCheck, FileText, ShieldAlert } from "lucide-react";
import { buildAdminWarnings } from "../utils/dataQuality.js";

const ready = (isReady) => (isReady ? "Ready" : "Missing");
const hasValue = (value) => String(value || "").trim().length > 0;
const hasCount = (value) => Number(value || 0) > 0;

const countKeys = ["kpis_tracked", "on_track", "watch", "under_pressure"];

const archiveRowForMonth = (archive = [], monthSort) => archive.find((item) => item.month_sort === monthSort);

const hasReceiptSection = (currentMonth) => hasValue(currentMonth?.receipts_pack_url)
  || hasValue(currentMonth?.receipts_pack_label)
  || hasValue(currentMonth?.source_document_1_url)
  || hasValue(currentMonth?.source_document_2_url);

const statusIcon = {
  Ready: CheckCircle2,
  Missing: AlertTriangle,
  "Manual check": CircleDashed,
};

const checklistSections = (data) => {
  const currentMonth = data.current_month || {};
  const counts = currentMonth.counts || {};
  const archiveRow = archiveRowForMonth(data.archive || [], currentMonth.month_sort);

  return [
    {
      title: "Data readiness",
      description: "Confirm that the public tracker data has enough monthly detail for editorial review.",
      items: [
        { label: "Monthly tracker rows loaded", status: ready((data.kpis || []).length > 0) },
        { label: "KPI count present", status: ready(hasCount(counts.kpis_tracked)) },
        { label: "Status counts present", status: ready(countKeys.some((key) => hasCount(counts[key]))) },
        { label: "Latest update available", status: ready(hasValue(currentMonth.latest_update_at) || hasValue(currentMonth.latest_update_note) || hasValue(currentMonth.latest_update_status)) },
      ],
    },
    {
      title: "Source readiness",
      description: "Check that the receipts and official source basis are visible for the selected month.",
      items: [
        { label: "Monthly outturn source available", status: ready(hasValue(currentMonth.monthly_outturn_source) || hasValue(currentMonth.source_document_1_url)) },
        { label: "Budget baseline source available", status: ready(hasValue(currentMonth.budget_baseline_source) || hasValue(currentMonth.source_document_2_url)) },
        { label: "Source note available", status: ready(hasValue(currentMonth.supporting_fiscal_context) || hasValue(currentMonth.what_changed_source_note)) },
        { label: "Receipts / source documents section available", status: ready(hasReceiptSection(currentMonth)) },
      ],
    },
    {
      title: "Public page readiness",
      description: "Verify that the public-facing narrative cards are populated before the month is treated as complete.",
      items: [
        { label: "Latest Update card available", status: ready(hasValue(currentMonth.latest_update_label) || hasValue(currentMonth.latest_update_note) || hasValue(currentMonth.latest_update_status)) },
        { label: "What Changed This Month summary available", status: ready(hasValue(currentMonth.what_changed_headline) || hasValue(currentMonth.what_changed_bullets) || hasValue(currentMonth.what_changed)) },
        { label: "Monthly note / public summary available", status: ready(hasValue(currentMonth.monthly_note) || hasValue(currentMonth.approved_email_summary)) },
        { label: "Archive row available", status: ready(Boolean(archiveRow)) },
      ],
    },
  ];
};

const manualSections = [
  {
    title: "Workflow readiness",
    description: "Manual confirmations only. These checkboxes do not trigger any workflow.",
    items: [
      "Publish Approved Tracker Rows completed",
      "Screenshot Capture workflow completed",
      "Social Pack workflow completed",
      "Subscriber Update workflow completed",
    ],
  },
  {
    title: "Editorial signoff",
    description: "Final editorial review before the month is considered ready for public posting.",
    items: [
      "Figures reviewed",
      "Source links checked",
      "Public wording reviewed",
      "Social captions reviewed",
      "Ready for public posting",
    ],
  },
];

const StatusPill = ({ status }) => {
  const Icon = statusIcon[status] || CircleDashed;
  return (
    <span className={`admin-status-pill admin-status-${status.toLowerCase().replace(/\s+/g, "-")}`}>
      <Icon size={16} aria-hidden="true" />
      {status}
    </span>
  );
};

const ComputedSection = ({ section }) => (
  <section className="admin-checklist-card" aria-labelledby={`admin-${section.title.replace(/\s+/g, "-").toLowerCase()}`}>
    <div className="admin-card-header">
      <FileText size={22} className="green-icon" aria-hidden="true" />
      <div>
        <h2 id={`admin-${section.title.replace(/\s+/g, "-").toLowerCase()}`}>{section.title}</h2>
        <p>{section.description}</p>
      </div>
    </div>
    <div className="admin-checklist-items">
      {section.items.map((item) => (
        <div key={item.label} className="admin-checklist-item">
          <span>{item.label}</span>
          <StatusPill status={item.status} />
        </div>
      ))}
    </div>
  </section>
);


const AdminWarningList = ({ warnings }) => {
  if (!warnings.length) return null;

  return (
    <section className="admin-warning-list" data-testid="admin-data-warning-list" aria-label="Admin data warnings">
      <div className="admin-card-header">
        <AlertTriangle size={22} className="admin-warning-icon" aria-hidden="true" />
        <div>
          <h2>Data warnings to review</h2>
          <p>These notices help editors spot missing or stale tracker inputs before publishing.</p>
        </div>
      </div>
      <ul>
        {warnings.map((warning) => <li key={warning}>{warning}</li>)}
      </ul>
    </section>
  );
};

const ManualSection = ({ section, checkedItems, onToggle }) => (
  <section className="admin-checklist-card admin-manual-card" aria-labelledby={`admin-${section.title.replace(/\s+/g, "-").toLowerCase()}`}>
    <div className="admin-card-header">
      <ClipboardCheck size={22} className="green-icon" aria-hidden="true" />
      <div>
        <h2 id={`admin-${section.title.replace(/\s+/g, "-").toLowerCase()}`}>{section.title}</h2>
        <p>{section.description}</p>
      </div>
    </div>
    <div className="admin-checklist-items">
      {section.items.map((label) => (
        <label key={label} className="admin-checklist-item admin-manual-item">
          <span className="admin-checkbox-label">
            <input type="checkbox" checked={Boolean(checkedItems[label])} onChange={() => onToggle(label)} />
            {label}
          </span>
          <StatusPill status="Manual check" />
        </label>
      ))}
    </div>
  </section>
);

export const isAdminChecklistRoute = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("admin")?.toLowerCase() === "checklist";
};

export const AdminChecklist = ({ data }) => {
  const [checkedItems, setCheckedItems] = useState({});
  const currentMonth = data.current_month || {};
  const sections = checklistSections(data);
  const adminWarnings = buildAdminWarnings(data);
  const monthLabel = currentMonth.month_label || currentMonth.month_sort || "Month pending";

  const toggleItem = (label) => setCheckedItems((items) => ({ ...items, [label]: !items[label] }));

  return (
    <div className="admin-checklist-page" data-testid="admin-checklist-page">
      <header className="admin-checklist-hero">
        <div>
          <p className="eyebrow">Internal admin checklist</p>
          <h1>{monthLabel} Admin Checklist</h1>
          <p className="admin-checklist-subtitle">Use this view to review tracker readiness for the selected month without adding a public navigation item.</p>
        </div>
        <div className="admin-month-panel">
          <span>Selected month</span>
          <strong>{currentMonth.month_sort || "Not selected"}</strong>
        </div>
      </header>

      <div className="admin-warning" role="note">
        <ShieldAlert size={22} aria-hidden="true" />
        <strong>This checklist is an internal editorial aid. It does not publish, send, or modify tracker data.</strong>
      </div>

      <main className="admin-checklist-grid" aria-label="Monthly admin checklist">
        <AdminWarningList warnings={adminWarnings} />
        {sections.map((section) => <ComputedSection key={section.title} section={section} />)}
        {manualSections.map((section) => (
          <ManualSection key={section.title} section={section} checkedItems={checkedItems} onToggle={toggleItem} />
        ))}
      </main>
    </div>
  );
};
