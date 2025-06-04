export default function ProfileChecklist({ checklist }: { checklist: any }) {
  if (!checklist) return null;
  const steps = [
    { key: 'how_to_use', label: 'Share how you plan to use' },
    { key: 'profile_details', label: 'Add details for your profile' },
    { key: 'communication', label: 'Set your communication preferences' },
  ];
  const completed = steps.filter(s => checklist[s.key]).length;
  return (
    <section>
      <h3 className="font-semibold text-lg mb-2">Profile Checklist</h3>
      <div className="w-full bg-gray-200 rounded h-2 mb-2">
        <div className="bg-emerald-500 h-2 rounded" style={{ width: `${(completed / steps.length) * 100}%` }} />
      </div>
      <ul>
        {steps.map(s => (
          <li key={s.key} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${checklist[s.key] ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
            <span>{s.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
