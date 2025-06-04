import { useState } from 'react';
import SidebarEdit from './SidebarEdit';

export default function AboutSection({ profile, isOwner, onUpdated }: { profile: any, isOwner: boolean, onUpdated?: () => void }) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg mb-2">About</h3>
        {isOwner && (
          <button className="text-emerald-600 text-sm" onClick={() => setOpen(true)}>
            {profile.description ? "Edit" : "Add"}
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
          { name: "description", label: "About you", type: "textarea", value: profile.description || "" }
        ]}
        apiUrl={`/api/users/${profile.clerk_id}/profile`}
        method="PUT"
        onSaved={() => { setOpen(false); onUpdated?.(); }}
      />
    </section>
  );
}
