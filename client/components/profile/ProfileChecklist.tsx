import { CheckCircle2, Circle } from 'lucide-react';

export default function ProfileChecklist({ checklist }: { checklist: any }) {
  if (!checklist) return (
    <section className="mb-6 p-4 border rounded-lg bg-gray-50 shadow-sm text-gray-400 italic text-center">No checklist data.</section>
  );
  const steps = [
    { key: 'how_to_use', label: 'Share how you plan to use' },
    { key: 'profile_details', label: 'Add details for your profile' },
    { key: 'communication', label: 'Set your communication preferences' },
  ];
  const completed = steps.filter(s => checklist[s.key]).length;
  return (
    <section className="mb-6 p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="font-semibold text-lg mb-2">Profile Checklist</h3>
      <div className="w-full bg-gray-200 rounded h-2 mb-4 overflow-hidden">
        <div className="bg-emerald-500 h-2 rounded transition-all" style={{ width: `${(completed / steps.length) * 100}%` }} />
      </div>
      <ul className="space-y-2">
        {steps.map(s => (
          <li key={s.key} className="flex items-center gap-3">
            {checklist[s.key]
              ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              : <Circle className="w-5 h-5 text-gray-300" />}
            <span className={checklist[s.key] ? 'text-gray-700 font-medium' : 'text-gray-400'}>{s.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
