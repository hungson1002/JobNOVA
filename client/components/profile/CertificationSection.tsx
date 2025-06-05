import { useEffect, useState } from 'react';
import SidebarEdit from './SidebarEdit';
import { Plus, Edit2, Trash2, Award } from 'lucide-react';

interface Certification {
  id: number;
  name: string;
  organization?: string;
  year?: number;
  description?: string;
}

export default function CertificationSection({ clerkId }: { clerkId: string }) {
  const [certs, setCerts] = useState<Certification[]>([]);
  const [open, setOpen] = useState(false);
  const [editCert, setEditCert] = useState<Certification | null>(null);

  const fetchCerts = async () => {
    const res = await fetch(`/api/users/${clerkId}`);
    const data = await res.json();
    setCerts(data.Certifications || []);
  };

  useEffect(() => { fetchCerts(); }, [clerkId, open]);

  const handleEdit = (cert: Certification) => {
    setEditCert(cert);
    setOpen(true);
  };
  const handleAdd = () => {
    setEditCert(null);
    setOpen(true);
  };

  // SidebarEdit fields
  const fields = [
    { name: "name", label: "Name", type: "text" as const, value: editCert?.name || "" },
    { name: "organization", label: "Organization", type: "text" as const, value: editCert?.organization || "" },
    { name: "year", label: "Year", type: "text" as const, value: editCert?.year ? String(editCert.year) : "" },
    { name: "description", label: "Description", type: "textarea" as const, value: editCert?.description || "" }
  ];

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg flex items-center gap-2"><Award className="w-5 h-5 text-amber-500" /> Certifications</h3>
        <button className="text-emerald-600 text-sm flex items-center gap-1 hover:underline" onClick={handleAdd}>
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      <ul className="space-y-3">
        {certs.length === 0 && <li className="text-gray-400 italic">No certifications yet.</li>}
        {certs.map(cert => (
          <li key={cert.id} className="flex items-center gap-3 p-3 rounded border bg-gray-50 shadow-sm">
            <span className="flex-1">
              <b>{cert.name}</b> {cert.organization && <span className="text-gray-500">({cert.organization})</span>}
              {cert.year && <span className="ml-2 inline-block px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">{cert.year}</span>}
              {cert.description && <span className="block text-gray-500 text-sm mt-1">{cert.description}</span>}
            </span>
            <button className="text-blue-500 hover:bg-blue-50 p-1 rounded" onClick={() => handleEdit(cert)} title="Edit"><Edit2 className="w-4 h-4" /></button>
            <button className="text-red-500 hover:bg-red-50 p-1 rounded" onClick={async () => {
              await fetch(`/api/users/${clerkId}/delete-certification/${cert.id}`, { method: 'DELETE' });
              fetchCerts();
            }} title="Delete"><Trash2 className="w-4 h-4" /></button>
          </li>
        ))}
      </ul>
      <SidebarEdit
        open={open}
        onClose={() => setOpen(false)}
        title={editCert ? "Edit Certification" : "Add Certification"}
        fields={fields}
        apiUrl={editCert
          ? `/api/users/${clerkId}/update-certification/${editCert.id}`
          : `/api/users/${clerkId}/add-certification`}
        method={editCert ? "PATCH" : "POST"}
        onSaved={() => { setOpen(false); fetchCerts(); }}
      />
    </section>
  );
}
