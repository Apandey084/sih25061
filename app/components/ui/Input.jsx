"use client";

export default function Input({ label, type = "text", value, onChange, name, required }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium">{label}</label>}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full border rounded-lg p-2"
      />
    </div>
  );
}