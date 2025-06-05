import { useState, useEffect } from 'react';

interface Field {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'select';
  value?: string;
  options?: { value: string | number; label: string }[];
}

export default function SidebarEdit({
  open, onClose, title, fields, apiUrl, method = "PUT", onSaved
}: {
  open: boolean,
  onClose: () => void,
  title: string,
  fields: Field[],
  apiUrl?: string,
  method?: "PUT" | "POST" | "PATCH",
  onSaved?: (form: any) => void
}) {
  const [form, setForm] = useState(() => Object.fromEntries(fields.map(f => [f.name, f.value || ""])));
  const [loading, setLoading] = useState(false);

  // Reset form state when fields or open changes
  useEffect(() => {
    if (open) {
      setForm(Object.fromEntries(fields.map(f => [f.name, f.value || ""])));
    }
  }, [fields, open]);

  if (!open) return null;

  const handleChange = (name: string, value: string) => {
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    if (apiUrl) {
      await fetch(apiUrl, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setLoading(false);
    onSaved?.(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 transition-colors duration-300">
      <div className="bg-white w-full max-w-md h-full p-8 shadow-2xl rounded-l-2xl relative animate-slideInRight">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-3xl font-bold transition-colors">&times;</button>
        <h2 className="text-xl font-bold mb-6">{title}</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {fields.map(f => (
            <div key={f.name}>
              <label className="block font-medium mb-2 text-gray-700">{f.label}</label>
              {f.type === "textarea" ? (
                <textarea
                  className="input w-full rounded border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                  value={form[f.name]}
                  onChange={e => handleChange(f.name, e.target.value)}
                  rows={5}
                  required
                />
              ) : f.type === 'select' && f.options ? (
                <select
                  className="input w-full rounded border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                  value={form[f.name]}
                  onChange={e => handleChange(f.name, e.target.value)}
                  required
                >
                  <option value="">Select {f.label.toLowerCase()}</option>
                  {f.options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  className="input w-full rounded border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition"
                  value={form[f.name]}
                  onChange={e => handleChange(f.name, e.target.value)}
                  required
                />
              )}
            </div>
          ))}
          <div className="flex gap-3 mt-6 justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 transition">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition flex items-center gap-2" disabled={loading}>
              {loading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>}
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slideInRight {
          animation: slideInRight 0.3s cubic-bezier(0.4,0,0.2,1);
        }
      `}</style>
    </div>
  );
}
