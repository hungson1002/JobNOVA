import { useState, useCallback } from "react";
import { CheckCircle2, Circle, X, Briefcase, List, Coffee } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';

interface PlanToUse {
  primary?: boolean;
  secondary?: boolean;
  non_business?: boolean;
}

interface ProfileChecklistProps {
  user: any;
  isOwner?: boolean;
  onUpdatePlan?: () => void;
}

function normalizePlan(plan: any): PlanToUse {
  if (!plan || typeof plan !== "object") return {};
  return {
    primary: !!plan.primary,
    secondary: !!plan.secondary,
    non_business: !!plan.non_business,
  };
}

const daysOfWeek = [
  'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'
];
const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

interface CommunicationPreferencesProps {
  preferredDays: { start?: string; end?: string };
  preferredHours: { start?: string; end?: string };
  timezone: string;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  error: string | null;
  setPreferredDays: React.Dispatch<React.SetStateAction<{ start?: string; end?: string }>>;
  setPreferredHours: React.Dispatch<React.SetStateAction<{ start?: string; end?: string }>>;
  setTimezone: React.Dispatch<React.SetStateAction<string>>;
}

function CommunicationPreferences({
  preferredDays,
  preferredHours,
  timezone,
  onSave,
  onCancel,
  saving,
  error,
  setPreferredDays,
  setPreferredHours,
  setTimezone,
}: CommunicationPreferencesProps) {
  return (
    <div className="px-8 pt-10 pb-8 flex flex-col items-center">
      <div className="font-semibold text-2xl mb-1 text-center">
        Collaboration preferences <span aria-label="chat" role="img">💬</span>
      </div>
      <div className="text-gray-500 text-base mb-6 text-center">
        Let freelancers know when and how you prefer to collaborate can help speed up the order process.
      </div>
      <div className="w-full max-w-lg bg-white rounded-xl p-6 border mb-6">
        <div className="font-medium mb-2">When do you prefer to communicate with freelancers?</div>
        <div className="text-gray-500 text-sm mb-4">
          You still might receive messages at other times, but freelancers will be aware of your preferred days and hours and won’t expect a quick reply.
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Select your preferred days <span className="text-gray-400">Ex. Mon-Fri or Sun-Sat</span></label>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[120px]">{preferredDays.start || 'Start day'}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {daysOfWeek.map(day => (
                  <DropdownMenuItem key={day} onClick={() => setPreferredDays(prev => ({ ...prev, start: day }))}>{day}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span>-</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[120px]">{preferredDays.end || 'End day'}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {daysOfWeek.map(day => (
                  <DropdownMenuItem key={day} onClick={() => setPreferredDays(prev => ({ ...prev, end: day }))}>{day}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Then, choose your preferred hours <span className="text-gray-400">Asia/Ho_Chi_Minh</span></label>
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[120px]">{preferredHours.start || 'Start time'}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {hours.map(h => (
                  <DropdownMenuItem key={h} onClick={() => setPreferredHours(prev => ({ ...prev, start: h }))}>{h}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <span>-</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[120px]">{preferredHours.end || 'End time'}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {hours.map(h => (
                  <DropdownMenuItem key={h} onClick={() => setPreferredHours(prev => ({ ...prev, end: h }))}>{h}</DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
      {error && <div className="mb-4 text-red-500">{error}</div>}
      <div className="flex flex-row gap-4 justify-center mt-2 w-full">
        <Button variant="outline" onClick={onCancel} disabled={saving} className="w-32">
          Cancel
        </Button>
        <Button
          onClick={onSave}
          disabled={saving || !preferredDays.start || !preferredDays.end || !preferredHours.start || !preferredHours.end}
          className="w-32"
        >
          {saving ? 'Saving...' : 'Done'}
        </Button>
      </div>
    </div>
  );
}

export default function ProfileChecklist({ user, isOwner = false, onUpdatePlan }: ProfileChecklistProps) {
  const { getToken } = useAuth();
  const [showPlanSlide, setShowPlanSlide] = useState(false);
  const [showCommPrefSlide, setShowCommPrefSlide] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingCommPref, setSavingCommPref] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commPrefError, setCommPrefError] = useState<string | null>(null);
  const [planDraft, setPlanDraft] = useState<PlanToUse>(normalizePlan(user?.plan_to_use));
  const [preferredDays, setPreferredDays] = useState<{ start?: string; end?: string }>({
    start: user?.preferred_days?.split('-')[0] || '',
    end: user?.preferred_days?.split('-')[1] || '',
  });
  const [preferredHours, setPreferredHours] = useState<{ start?: string; end?: string }>({
    start: user?.preferred_hours?.split('-')[0] || '',
    end: user?.preferred_hours?.split('-')[1] || '',
  });
  const plan = normalizePlan(user?.plan_to_use);
  const howToUseOptions = [
    {
      key: 'primary',
      icon: <Briefcase className="w-6 h-6 mb-1" />,
      title: 'Primary job or business',
      desc: 'A project for the company you work for or your own business.',
      checked: !!plan.primary,
    },
    {
      key: 'secondary',
      icon: <List className="w-6 h-6 mb-1" />,
      title: 'Secondary business',
      desc: 'Anything you’re working on apart from your main job.',
      checked: !!plan.secondary,
    },
    {
      key: 'non_business',
      icon: <Coffee className="w-6 h-6 mb-1" />,
      title: 'Non-business needs',
      desc: 'Services that are for your own growth or enjoyment.',
      checked: !!plan.non_business,
    },
  ];
  const howToUseDone = Object.values(plan).some(Boolean);
  const commPrefDone = preferredDays.start && preferredDays.end && preferredHours.start && preferredHours.end;

  // Checklist steps
  const steps = [
    {
      key: 'how_to_use',
      label: 'Share how you plan to use JobNOVA',
      description: 'This information won’t be visible to others.',
      done: howToUseDone,
      percent: howToUseDone ? 0.5 : 0,
    },
    {
      key: 'comm_pref',
      label: 'Set your communication preferences',
      description: 'Let freelancers know your collaboration preferences',
      done: !!commPrefDone,
      percent: commPrefDone ? 0.5 : 0,
    },
  ];
  const completed = steps.reduce((acc, s) => acc + (s.done ? 1 : 0), 0);
  const progress = steps.reduce((acc, s) => acc + s.percent, 0);

  // Hàm chọn plan
  const handlePlanSelect = useCallback((key: keyof PlanToUse) => {
    setPlanDraft((draft) => ({ ...draft, [key]: !draft[key] }));
  }, []);  // Hàm lưu plan
  const handlePlanSave = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      // Always use user.clerk_id (user is the profile object)
      if (!user?.clerk_id) {
        setError('User not found in database.');
        setSaving(false);
        return;
      }
      const token = await getToken();
      if (!token) {
        setError('Not authenticated. Please log in again.');
        setSaving(false);
        return;
      }
      const response = await fetch(`http://localhost:8800/api/users/${user.clerk_id}/update-profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ plan_to_use: planDraft }),
      });
      if (!response.ok) {
        let errMsg = 'Could not update plan';
        if (response.status === 401) errMsg = 'Unauthorized: User not found in database.';
        if (response.status === 404) errMsg = 'User not found.';
        try {
          const errData = await response.json();
          errMsg = errData.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      const data = await response.json();
      // Use the merged plan_to_use from backend response
      setPlanDraft(data.plan_to_use || planDraft);
      if (onUpdatePlan) onUpdatePlan();
      setShowPlanSlide(false);
    } catch (err: any) {
      setError(err.message || 'Could not update plan');
      console.error('Error updating plan_to_use:', err);
    } finally {
      setSaving(false);
    }
  }, [planDraft, user, getToken, onUpdatePlan]);

  // Save communication preferences
  const handleCommPrefSave = useCallback(async () => {
    setSavingCommPref(true);
    setCommPrefError(null);
    try {
      if (!user?.clerk_id) throw new Error('User not found in database.');
      const token = await getToken();
      if (!token) throw new Error('Not authenticated. Please log in again.');
      const response = await fetch(`http://localhost:8800/api/users/${user.clerk_id}/update-profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          preferred_days: preferredDays.start && preferredDays.end ? `${preferredDays.start}-${preferredDays.end}` : '',
          preferred_hours: preferredHours.start && preferredHours.end ? `${preferredHours.start}-${preferredHours.end}` : '',
          timezone: 'Asia/Ho_Chi_Minh',
        }),
      });
      if (!response.ok) {
        let errMsg = 'Could not update communication preferences';
        try {
          const errData = await response.json();
          errMsg = errData.message || errMsg;
        } catch {}
        throw new Error(errMsg);
      }
      if (onUpdatePlan) onUpdatePlan();
      setShowCommPrefSlide(false);
    } catch (err: any) {
      setCommPrefError(err.message || 'Could not update communication preferences');
    } finally {
      setSavingCommPref(false);
    }
  }, [preferredDays, preferredHours, user, getToken, onUpdatePlan]);

  return (
    <section className="mb-6 p-4 border rounded-lg bg-white shadow-sm relative">
      <h3 className="font-semibold text-lg mb-2">Profile Checklist</h3>
      <div className="w-full bg-gray-200 rounded h-2 mb-4 overflow-hidden">
        <div className="bg-emerald-500 h-2 rounded transition-all" style={{ width: `${progress * 100}%` }} />
      </div>
      <ul className="space-y-3">
        <li
          className="flex flex-col gap-2 p-3 rounded-lg border bg-gray-50 shadow-sm cursor-pointer hover:border-emerald-400 transition-all"
          onClick={() => isOwner && setShowPlanSlide(true)}
        >
          <div className="flex items-center gap-3">
            {howToUseDone ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300" />
            )}
            <div className="flex-1">
              <div className={howToUseDone ? 'text-gray-700 font-medium' : 'text-gray-400 font-medium'}>
                Share how you plan to use JobNOVA
              </div>
              <div className="text-xs text-gray-500">This information won’t be visible to others.</div>
              {howToUseDone && (
                <div className="text-xs text-emerald-700 mt-1">
                  <ul className="list-disc list-inside">
                    {(Object.keys(plan) as (keyof PlanToUse)[])
                      .filter(k => plan[k])
                      .map(k => (
                        <li key={k}>
                          {k === 'primary' && 'Primary job/business'}
                          {k === 'secondary' && 'Secondary business'}
                          {k === 'non_business' && 'Non-business needs'}
                        </li>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </li>
        <li
          className="flex flex-col gap-2 p-3 rounded-lg border bg-gray-50 shadow-sm cursor-pointer hover:border-emerald-400 transition-all"
          onClick={() => isOwner && setShowCommPrefSlide(true)}
        >
          <div className="flex items-center gap-3">
            {commPrefDone ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <Circle className="w-5 h-5 text-gray-300" />
            )}
            <div className="flex-1">
              <div className={commPrefDone ? 'text-gray-700 font-medium' : 'text-gray-400 font-medium'}>
                Set your communication preferences
              </div>
              <div className="text-xs text-gray-500">Let freelancers know your collaboration preferences</div>
              {commPrefDone && (
                <div className="text-xs text-emerald-700 mt-1">
                  {preferredDays.start && preferredDays.end && (
                    <div>Days: {preferredDays.start} - {preferredDays.end}</div>
                  )}
                  {preferredHours.start && preferredHours.end && (
                    <div>Hours: {preferredHours.start} - {preferredHours.end} (Asia/Ho_Chi_Minh)</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </li>
      </ul>
      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
      {showPlanSlide && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-0 relative animate-slideInUp overflow-hidden">
            <button
              onClick={() => setShowPlanSlide(false)}
              className="absolute top-5 right-6 text-gray-400 hover:text-gray-700 text-3xl font-bold transition-colors z-10"
              aria-label="Close"
            >
              <X />
            </button>
            <div className="px-8 pt-10 pb-8 flex flex-col items-center">
              <div className="font-semibold text-2xl mb-1 text-center">
                Let’s get started <span aria-label="party" role="img">🎉</span>
              </div>
              <div className="text-gray-500 text-base mb-6 text-center">This information won’t be visible to others.</div>
              <div className="font-medium mb-6 text-lg text-center">What do you plan to order services for?</div>
              <div className="flex flex-row gap-6 w-full justify-center items-stretch">
                {howToUseOptions.map((opt) => {
                  const selected = planDraft[opt.key as keyof PlanToUse];
                  return (
                    <div
                      key={opt.key}
                      className={`flex-1 min-w-[200px] max-w-[260px] border rounded-xl p-6 flex flex-col items-start cursor-pointer transition-all duration-150 relative group shadow-sm
                        ${selected ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200' : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-md'}
                      `}
                      tabIndex={0}
                      onClick={() => handlePlanSelect(opt.key as keyof PlanToUse)}
                      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handlePlanSelect(opt.key as keyof PlanToUse)}
                      aria-pressed={selected}
                    >
                      <div className="flex items-center gap-2 mb-3">
                        {opt.icon}
                        <span className="font-semibold text-lg">{opt.title}</span>
                        {selected && (
                          <CheckCircle2 className="ml-1 w-5 h-5 text-emerald-500" />
                        )}
                      </div>
                      <div className="text-gray-500 text-sm mb-1 leading-relaxed">{opt.desc}</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-row gap-4 justify-center mt-10 w-full">
                <Button variant="outline" onClick={() => setShowPlanSlide(false)} disabled={saving} className="w-32">
                  Cancel
                </Button>
                <Button
                  onClick={handlePlanSave}
                  disabled={saving || !Object.values(planDraft).some(Boolean)}
                  className="w-32"
                >
                  {saving ? 'Saving...' : 'Done'}
                </Button>
              </div>
            </div>
            <style jsx global>{`
              @keyframes slideInUp {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
              }
              .animate-slideInUp {
                animation: slideInUp 0.3s cubic-bezier(0.4,0,0.2,1);
              }
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              .animate-fadeIn {
                animation: fadeIn 0.2s;
              }
            `}</style>
          </div>
        </div>
      )}
      {showCommPrefSlide && (
        <div className="fixed inset-0 z-50 flex justify-center items-center bg-black/40 animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-0 relative animate-slideInUp overflow-hidden">
            <button
              onClick={() => setShowCommPrefSlide(false)}
              className="absolute top-5 right-6 text-gray-400 hover:text-gray-700 text-3xl font-bold transition-colors z-10"
              aria-label="Close"
            >
              <X />
            </button>
            <CommunicationPreferences
              preferredDays={preferredDays}
              preferredHours={preferredHours}
              timezone={'Asia/Ho_Chi_Minh'}
              onSave={handleCommPrefSave}
              onCancel={() => setShowCommPrefSlide(false)}
              saving={savingCommPref}
              error={commPrefError}
              setPreferredDays={setPreferredDays}
              setPreferredHours={setPreferredHours}
              setTimezone={() => {}}
            />
          </div>
        </div>
      )}
    </section>
  );
}