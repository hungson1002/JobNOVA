import { useEffect, useState } from 'react';
import SidebarEdit from './SidebarEdit';
import { Plus, X } from 'lucide-react';

interface Skill {
  id: number;
  name: string;
}

export default function SkillsSection({ clerkId }: { clerkId: string }) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Fetch user's skills
  const fetchSkills = async () => {
    setLoading(true);
    const res = await fetch(`/api/seekerSkills/clerk/${clerkId}`);
    const data = await res.json();
    setSkills(data.skills || []);
    setLoading(false);
  };

  useEffect(() => { fetchSkills(); }, [clerkId, open]);

  // Fetch all available skills
  useEffect(() => {
    fetch('/api/skills')
      .then(res => res.json())
      .then(data => setAllSkills(data.skills || []));
  }, []);

  // SidebarEdit fields for add
  const fields = [
    {
      name: 'skill_id',
      label: 'Skill',
      type: 'text',
      value: selectedSkill,
    },
  ];

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg flex items-center gap-2">Skills</h3>
        <button className="text-emerald-600 text-sm flex items-center gap-1 hover:underline" onClick={() => setOpen(true)}>
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
      {loading ? (
        <div className="text-gray-400 italic">Loading...</div>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {skills.length === 0 && <li className="text-gray-400 italic">No skills yet.</li>}
          {skills.map(skill => (
            <li key={skill.id} className="px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full flex items-center gap-1 text-emerald-700 shadow-sm">
              {skill.name}
              <button className="text-xs text-red-500 ml-1 hover:bg-red-100 rounded-full p-1" onClick={async () => {
                await fetch(`/api/seekerSkills/${skill.id}`, { method: 'DELETE' });
                fetchSkills();
              }} title="Remove">
                <X className="w-3 h-3" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <SidebarEdit
        open={open}
        onClose={() => setOpen(false)}
        title="Add Skill"
        fields={[
          {
            name: 'skill_id',
            label: 'Skill',
            type: 'select',
            value: selectedSkill,
            options: allSkills.filter(s => !skills.some(us => us.id === s.id)).map(skill => ({ value: skill.id, label: skill.name })),
          },
        ]}
        apiUrl={`/api/seekerSkills`}
        method="POST"
        onSaved={() => { setOpen(false); setSelectedSkill(''); fetchSkills(); }}
      />
    </section>
  );
}
