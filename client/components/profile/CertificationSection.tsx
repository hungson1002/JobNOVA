import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';

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
  const [form, setForm] = useState({ name: '', organization: '', year: '', description: '' });

  // Fetch certifications
  useEffect(() => {
    fetch(`/api/users/${clerkId}/profile`)
      .then(res => res.json())
      .then(data => setCerts(data.Certifications || []));
  }, [clerkId, open]);

  // Open modal for add or edit
  const handleEdit = (cert: Certification) => {
    setEditCert(cert);
    setForm({
      name: cert.name || '',
      organization: cert.organization || '',
      year: cert.year ? String(cert.year) : '',
      description: cert.description || '',
    });
    setOpen(true);
  };

  const handleAdd = () => {
    setEditCert(null);
    setForm({ name: '', organization: '', year: '', description: '' });
    setOpen(true);
  };

  // Submit add or edit
  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const method = editCert ? 'PUT' : 'POST';
    const url = editCert
      ? `/api/users/${clerkId}/certifications/${editCert.id}`
      : `/api/users/${clerkId}/certifications`;
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        year: form.year ? parseInt(form.year) : undefined,
      }),
    });
    setOpen(false);
  };

  // Delete certification
  const handleDelete = async (id: number) => {
    await fetch(`/api/users/${clerkId}/certifications/${id}`, { method: 'DELETE' });
    setOpen(false);
  };

  return (
    <section>
      <h3 className="font-semibold text-lg mb-2 flex items-center justify-between">
        Certifications
        <button className="text-emerald-600 text-sm" onClick={handleAdd}>+ Add</button>
      </h3>
      <ul>
        {certs.length === 0 && <li className="text-gray-400">No certifications yet.</li>}
        {certs.map(cert => (
          <li key={cert.id} className="flex items-center gap-2">
            <span>
              <b>{cert.name}</b> {cert.organization && <>({cert.organization})</>} {cert.year}
              {cert.description && <span className="text-gray-500"> - {cert.description}</span>}
            </span>
            <button className="text-xs text-blue-500" onClick={() => handleEdit(cert)}>Edit</button>
            <button className="text-xs text-red-500" onClick={() => handleDelete(cert.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <Modal open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input className="input" placeholder="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
          <input className="input" placeholder="Organization" value={form.organization} onChange={e => setForm(f => ({ ...f, organization: e.target.value }))} />
          <input className="input" placeholder="Year" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} />
          <textarea className="input" placeholder="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
            <button type="submit" className="px-3 py-1 bg-emerald-600 text-white rounded">{editCert ? 'Save' : 'Add'}</button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
