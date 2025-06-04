import { useState } from 'react';

const steps = [
  { key: "description", label: "About", type: "textarea" },
  { key: "location", label: "Location", type: "text" },
  { key: "languages", label: "Languages", type: "text" },
  // Thêm các step khác nếu cần
];

export default function StepForm({ clerkId, initialData, onCompleted }: { clerkId: string, initialData?: any, onCompleted?: () => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(initialData || {});
  const [loading, setLoading] = useState(false);

  const handleChange = (key: string, value: string) => {
    setForm((f: Record<string, any>) => ({ ...f, [key]: value }));
  };

  const handleNext = async () => {
    setLoading(true);
    await fetch(`/api/users/${clerkId}/profile`, {
      method: "PUT",
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [steps[step].key]: form[steps[step].key] }),
    });
    setLoading(false);
    if (step < steps.length - 1) setStep(s => s + 1);
    else onCompleted?.();
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-lg font-bold mb-4">{steps[step].label}</h2>
      {steps[step].type === "textarea" ? (
        <textarea
          className="input w-full"
          value={form[steps[step].key] || ""}
          onChange={e => handleChange(steps[step].key, e.target.value)}
          rows={4}
        />
      ) : (
        <input
          className="input w-full"
          value={form[steps[step].key] || ""}
          onChange={e => handleChange(steps[step].key, e.target.value)}
        />
      )}
      <div className="flex justify-between mt-4">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="px-4 py-2 bg-gray-200 rounded">Back</button>
        )}
        <button onClick={handleNext} className="px-4 py-2 bg-emerald-600 text-white rounded" disabled={loading}>
          {step < steps.length - 1 ? "Next" : "Finish"}
        </button>
      </div>
    </div>
  );
}
