import { useState, useEffect } from 'react';
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";

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

  // Reset form state chỉ khi open chuyển từ false -> true
  useEffect(() => {
    if (open) {
      setForm(Object.fromEntries(fields.map(f => [f.name, f.value || ""])));
    }
    // eslint-disable-next-line
  }, [open]);

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
        // Send as string for express.raw compatibility
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
              <Label htmlFor={f.name}>{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea
                  id={f.name}
                  value={form[f.name]}
                  onChange={e => handleChange(f.name, e.target.value)}
                  rows={5}
                  required
                />
              ) : f.type === 'select' && f.options ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full justify-between"
                      id={f.name}
                    >
                      {form[f.name]
                        ? f.options.find(opt => opt.value === form[f.name])?.label || 'Select ' + f.label.toLowerCase()
                        : 'Select ' + f.label.toLowerCase()}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-full">
                    {f.options.map(opt => (
                      <DropdownMenuItem
                        key={opt.value}
                        onSelect={() => handleChange(f.name, String(opt.value))}
                        className={form[f.name] === String(opt.value) ? 'bg-emerald-100 font-semibold' : ''}
                      >
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Input
                  id={f.name}
                  value={form[f.name]}
                  onChange={e => handleChange(f.name, e.target.value)}
                  required
                />
              )}
            </div>
          ))}
          <div className="flex gap-3 mt-6 justify-end">
            <Button type="button" onClick={onClose} variant="outline">Cancel</Button>
            <Button type="submit" disabled={loading}>
              {loading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>}
              {loading ? "Saving..." : "Save"}
            </Button>
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
