import { useState } from 'react';

interface Field {
  name: string;
  label: string;
  type?: 'text' | 'textarea';
  value?: string;
}

export default function SidebarEdit({
  open, onClose, title, fields, apiUrl, method = "PUT", onSaved
}: {
  open: boolean,
  onClose: () => void,
  title: string,
  fields: Field[],
  apiUrl: string,
  method?: "PUT" | "POST",
  onSaved?: () => void
}) {
  const [form, setForm] = useState(() => Object.fromEntries(fields.map(f => [f.name, f.value || ""])));
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleChange = (name: string, value: string) => {
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    await fetch(apiUrl, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setLoading(false);
    onSaved?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
      <div className="bg-white w-full max-w-md h-full p-6 shadow-lg relative">
        <button onClick={onClose} className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-xl">&times;</button>
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map(f => (
            <div key={f.name}>
              <label className="block font-medium mb-1">{f.label}</label>
              {f.type === "textarea" ? (
                <textarea
                  className="input w-full"
                  value={form[f.name]}
                  onChange={e => handleChange(f.name, e.target.value)}
                  rows={4}
                  required
                />
              ) : (
                <input
                  className="input w-full"
                  value={form[f.name]}
                  onChange={e => handleChange(f.name, e.target.value)}
                  required
                />
              )}
            </div>
          ))}
          <div className="flex gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
