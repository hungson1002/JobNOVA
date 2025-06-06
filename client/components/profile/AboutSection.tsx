import { useState } from 'react';
import SidebarEdit from './SidebarEdit';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Info } from 'lucide-react';

export default function AboutSection({ profile, isOwner, onUpdated }: { profile: any, isOwner: boolean, onUpdated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  const handleSave = async (form: any) => {
    setLoading(true);
    try {
      // Defensive validation
      const desc = typeof form.description === 'string' ? form.description.trim() : '';
      if (!desc) {
        throw new Error('Description cannot be empty');
      }
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication error: Unable to get token');
      }
      // SkillsSection always sends clerk_id in body, AboutSection should too
      const requestBody: any = {
        clerk_id: profile.clerk_id,
        description: desc
      };
      const response = await fetch(`http://localhost:8800/api/users/${profile.clerk_id}/update-profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }
      toast.success(!profile.description ? 'Description added successfully' : 'Description updated successfully');
      setOpen(false);
      onUpdated?.();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error((error as Error).message || 'An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Info className="w-5 h-5 text-emerald-500" /> About
        </h3>
        {isOwner && (
          <button
            className="text-emerald-600 text-sm flex items-center gap-1 px-3 py-1 rounded hover:bg-emerald-50 border border-emerald-100 transition disabled:opacity-50"
            onClick={() => setOpen(true)}
            disabled={loading}
          >
            {profile.description ? <span>Edit</span> : <span>Add</span>}
          </button>
        )}
      </div>
      <div className="rounded-lg bg-emerald-50/40 border border-emerald-100 p-4 min-h-[64px]">
        <p className={`text-gray-700 whitespace-pre-line ${!profile.description ? 'italic text-gray-400' : ''}`}>
          {profile.description || 'No description yet.'}
        </p>
      </div>
      <SidebarEdit
        open={open}
        onClose={() => setOpen(false)}
        title="Edit About"
        fields={[
          { name: 'description', label: 'About you', type: 'textarea', value: profile.description || '' },
        ]}
        onSaved={handleSave}
      />
    </section>
  );
}