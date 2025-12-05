"use client";

export default function TextArea({ label, value, onChange, name, rows = 3 }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium">{label}</label>}
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        className="w-full border rounded-lg p-2"
      />
    </div>
  );
}