import { useEffect, useState } from 'react';
import Modal from '../ui/Modal';

interface Skill {
  id: number;
  name: string;
}

export default function SkillsSection({ clerkId }: { clerkId: string }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string>('');

  // Fetch user's skills
  useEffect(() => {
    fetch(`/api/seekerSkills/clerk/${clerkId}`)
      .then(res => res.json())
      .then(data => setSkills(data.skills || []));
  }, [clerkId, open]);

  // Fetch all available skills
  useEffect(() => {
    fetch('/api/skills')
      .then(res => res.json())
      .then(data => setAllSkills(data.skills || []));
  }, []);

  // Add skill
  const handleAdd = async (e: any) => {
    e.preventDefault();
    if (!selectedSkill) return;
    await fetch(`/api/seekerSkills`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clerk_id: clerkId, skill_id: parseInt(selectedSkill) }),
    });
    setOpen(false);
    setSelectedSkill('');
  };

  // Delete skill
  const handleDelete = async (id: number) => {
    await fetch(`/api/seekerSkills/${id}`, { method: 'DELETE' });
    setOpen(false);
  };

  return (
    <section>
      <h3 className="font-semibold text-lg mb-2 flex items-center justify-between">
        Skills
        <button className="text-emerald-600 text-sm" onClick={() => setOpen(true)}>+ Add</button>
      </h3>
      <ul className="flex flex-wrap gap-2">
        {skills.length === 0 && <li className="text-gray-400">No skills yet.</li>}
        {skills.map(skill => (
          <li key={skill.id} className="px-3 py-1 bg-gray-100 rounded flex items-center gap-1">
            {skill.name}
            <button className="text-xs text-red-500 ml-1" onClick={() => handleDelete(skill.id)}>x</button>
          </li>
        ))}
      </ul>
      <Modal open={open} onClose={() => setOpen(false)}>
        <form onSubmit={handleAdd} className="space-y-2">
          <select
            className="input w-full"
            value={selectedSkill}
            onChange={e => setSelectedSkill(e.target.value)}
            required
          >
            <option value="">Select skill</option>
            {allSkills
              .filter(s => !skills.some(us => us.id === s.id))
              .map(skill => (
                <option key={skill.id} value={skill.id}>{skill.name}</option>
              ))}
          </select>
          <div className="flex gap-2 mt-2">
            <button type="button" onClick={() => setOpen(false)} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
            <button type="submit" className="px-3 py-1 bg-emerald-600 text-white rounded">Add</button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
