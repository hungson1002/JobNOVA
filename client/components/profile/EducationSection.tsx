import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';

export default function EducationSection({ clerkId }: { clerkId: string }) {
  const [educations, setEducations] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editEdu, setEditEdu] = useState<any>(null);
  const [form, setForm] = useState({ school: '', degree: '', year_of_graduation: '' });

  useEffect(() => {
    fetch(`/api/users/${clerkId}/profile`)
      .then(res => res.json())
      .then(data => setEducations(data.Educations || []));
  }, [clerkId, open]);

  const handleEdit = (edu: any) => {
    setEditEdu(edu);
    setForm({ school: edu.school, degree: edu.degree, year_of_graduation: edu.year_of_graduation || '' });
    setOpen(true);
  };

  const handleAdd = () => {
    setEditEdu(null);
    setForm({ school: '', degree: '', year_of_graduation: '' });
    setOpen(true);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const method = editEdu ? 'PUT' : 'POST';
    const url = editEdu
      ? `/api/users/${clerkId}/educations/${editEdu.id}`
      : `/api/users/${clerkId}/educations`;
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    setOpen(false);
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/users/${clerkId}/educations/${id}`, { method: 'DELETE' });
    setOpen(false);
  };

  return (
    <section>
      <h3 className="font-semibold text-lg mb-2 flex items-center justify-between">
        Education
        <button className="text-emerald-600 text-sm" onClick={handleAdd}>+ Add</button>
      </h3>
      <ul>
        {educations.length === 0 && <li className="text-gray-400">No education yet.</li>}
        {educations.map(edu => (
          <li key={edu.id} className="flex items-center gap-2">
            <span><b>{edu.school}</b> ({edu.degree}) {edu.year_of_graduation}</span>
            <button className="text-xs text-blue-500" onClick={() => handleEdit(edu)}>Edit</button>
            <button className="text-xs text-red-500" onClick={() => handleDelete(edu.id)}>Delete</button>
          </li>
        ))}
      </ul>
      <Modal open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleSubmit} className="space-y-2">
          <input className="input" placeholder="School" value={form.school} onChange={e => setForm(f => ({ ...f, school: e.target.value }))} required />
          <input className="input" placeholder="Degree" value={form.degree} onChange={e => setForm(f => ({ ...f, degree: e.target.value }))} required />
          <input className="input" placeholder="Year" value={form.year_of_graduation} onChange={e => setForm(f => ({ ...f, year_of_graduation: e.target.value }))} />
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
            <button type="submit" className="px-3 py-1 bg-emerald-600 text-white rounded">{editEdu ? 'Save' : 'Add'}</button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
