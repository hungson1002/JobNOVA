import { useState } from 'react';
import SidebarEdit from './SidebarEdit';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

export default function AboutSection({ profile, isOwner, onUpdated }: { profile: any, isOwner: boolean, onUpdated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { getToken } = useAuth();

  const handleSave = async (form: any) => {
    setLoading(true);
    try {
      // Validation đơn giản
      if (!form.description || form.description.trim().length === 0) {
        throw new Error('Description cannot be empty');
      }

      const token = await getToken();
      if (!token) {
        throw new Error('Authentication error: Unable to get token');
      }

      const requestBody = {
        description: form.description.trim()
      };

      console.log('Sending update request:', { 
        clerk_id: profile.clerk_id, 
        body: requestBody 
      });

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

      console.log('Profile updated successfully:', data);
      toast.success('Profile updated successfully');
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
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg mb-2">About</h3>
        {isOwner && (
          <button
            className="text-emerald-600 text-sm disabled:opacity-50"
            onClick={() => setOpen(true)}
            disabled={loading}
          >
            {profile.description ? 'Edit' : 'Add'}
          </button>
        )}
      </div>
      <p className="text-gray-700 whitespace-pre-line">
        {profile.description || <span className="text-gray-400">No description yet.</span>}
      </p>
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