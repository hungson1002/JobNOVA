import { useEffect, useState } from 'react';
import SidebarEdit from './SidebarEdit';
import { Plus, X, Zap } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

interface Skill {
  id: number;
  name: string;
}

interface SeekerSkill {
  id: number;
  clerk_id: string;
  skill_id: number;
  Skills?: Skill; // Optional since it comes from include
}

export default function SkillsSection({ clerkId, isOwner = false }: { clerkId: string, isOwner?: boolean }) {
  const [seekerSkills, setSeekerSkills] = useState<SeekerSkill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { getToken } = useAuth();
  // Fetch user's skills using dedicated seekerSkills route
  const fetchSkills = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }

      const res = await fetch(`http://localhost:8800/api/seekerSkills/clerk/${clerkId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch skills: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setSeekerSkills(data.seekerSkills || []);
    } catch (err) {
      console.error('Error fetching skills:', err);
      toast.error('Failed to load skills data.');
      setSeekerSkills([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSkills(); }, [clerkId, open]);

  // Fetch all available skills
  useEffect(() => {
    const fetchAllSkills = async () => {
      try {
        const res = await fetch('http://localhost:8800/api/skills');
        if (!res.ok) {
          throw new Error(`Failed to fetch available skills: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        setAllSkills(data.skills || []);
      } catch (err) {
        console.error('Error fetching available skills:', err);
        toast.error('Failed to load available skills.');
        setAllSkills([]);
      }
    };
    fetchAllSkills();
  }, []);

  const handleAdd = () => {
    setSelectedSkill('');
    setOpen(true);
  };
  const handleDelete = async (seekerSkillId: number) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication error: Unable to get token');
      }

      const response = await fetch(`http://localhost:8800/api/seekerSkills/${seekerSkillId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete skill');
      }

      toast.success('Skill removed successfully');
      fetchSkills();
    } catch (error) {
      console.error('Error deleting skill:', error);
      toast.error((error as Error).message || 'An error occurred while removing skill');
    }
  };

  const handleSave = async (form: any) => {
    setSaving(true);
    try {
      // Validation
      if (!form.skill_id) {
        throw new Error('Please select a skill');
      }
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication error: Unable to get token');
      }
      const requestBody = {
        clerk_id: clerkId,
        skill_id: parseInt(form.skill_id)
      };
      const response = await fetch(`http://localhost:8800/api/seekerSkills`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to add skill');
      }
      toast.success('Skill added successfully');
      setOpen(false);
      setSelectedSkill('');
      setTimeout(fetchSkills, 100); // Add a slight delay to ensure backend update
    } catch (error) {
      console.error('Error saving skill:', error);
      toast.error((error as Error).message || 'An error occurred while adding skill');
    } finally {
      setSaving(false);
    }
  };
  // Get available skills that are not already added by the user
  const availableSkills = allSkills.filter(skill => 
    !seekerSkills.some(seekerSkill => seekerSkill.skill_id === skill.id)
  );

  // Helper to get skill name from relation or fallback to allSkills
  const getSkillName = (seekerSkill: SeekerSkill) =>
    seekerSkill.Skills?.name ||
    allSkills.find(skill => skill.id === seekerSkill.skill_id)?.name ||
    'Unknown Skill';

  // SidebarEdit fields
  const fields = [
    {
      name: 'skill_id',
      label: 'Skill',
      type: 'select' as const,
      value: selectedSkill,
      options: availableSkills.map(skill => ({ 
        value: skill.id.toString(), 
        label: skill.name 
      })),
    },
  ];

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" /> Skills
        </h3>
        {isOwner && (
          <button
            className="text-emerald-600 text-sm flex items-center gap-1 hover:underline disabled:opacity-50"
            onClick={handleAdd}
            disabled={loading || availableSkills.length === 0}
            title={availableSkills.length === 0 ? "All available skills have been added" : "Add skill"}
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        )}
      </div>
      {loading ? (
        <div className="text-gray-400 italic">Loading...</div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {seekerSkills.length === 0 && (
            <div className="text-gray-400 italic">No skills yet.</div>
          )}          {seekerSkills.map(seekerSkill => (
            <div 
              key={seekerSkill.id} 
              className="px-3 py-2 bg-gradient-to-r from-emerald-50 to-blue-50 border border-emerald-200 rounded-full flex items-center gap-2 text-emerald-700 shadow-sm hover:shadow-md transition-shadow"
            >
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">{getSkillName(seekerSkill)}</span>
              {isOwner && (
                <button 
                  className="text-red-500 hover:bg-red-100 rounded-full p-1 transition-colors" 
                  onClick={() => handleDelete(seekerSkill.id)} 
                  title="Remove skill"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <SidebarEdit
        open={open}
        onClose={() => setOpen(false)}
        title="Add Skill"
        fields={fields}
        onSaved={handleSave}
      />
    </section>
  );
}
