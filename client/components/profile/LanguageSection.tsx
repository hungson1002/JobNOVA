import { useEffect, useState } from 'react';
import SidebarEdit from './SidebarEdit';
import { Plus, Edit2, Trash2, Globe2 } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

interface Language {
  name: string;
  level: string;
}

const LANGUAGE_OPTIONS = [
  'English', 'Vietnamese', 'French', 'German', 'Spanish', 'Chinese', 'Japanese', 'Korean', 'Russian', 'Italian', 'Portuguese', 'Arabic', 'Hindi', 'Bengali', 'Turkish', 'Persian', 'Urdu', 'Thai', 'Indonesian', 'Malay', 'Dutch', 'Polish', 'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Czech', 'Hungarian', 'Greek', 'Romanian', 'Bulgarian', 'Ukrainian', 'Hebrew', 'Swahili'
];
const LEVEL_OPTIONS = [
  'Native', 'Fluent', 'Professional', 'Conversational', 'Basic'
];

export default function LanguageSection({ clerkId, isOwner = false }: { clerkId: string, isOwner?: boolean }) {
  const [languages, setLanguages] = useState<Language[]>([]);
  const [open, setOpen] = useState(false);
  const [editLang, setEditLang] = useState<Language | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { getToken } = useAuth();

  // Fetch user languages
  const fetchLanguages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8800/api/users/${clerkId}`);
      if (!res.ok) throw new Error('Failed to fetch user languages');
      const data = await res.json();
      setLanguages(Array.isArray(data.languages) ? data.languages : []);
    } catch (err) {
      console.error('Error fetching languages:', err);
      toast.error('Failed to load language data.');
      setLanguages([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLanguages(); }, [clerkId, open]);

  const handleEdit = (lang: Language) => {
    setEditLang(lang);
    setOpen(true);
  };

  const handleAdd = () => {
    setEditLang(null);
    setOpen(true);
  };

  const handleDelete = async (lang: Language) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('Authentication error: Unable to get token');
      const updated = languages.filter(l => !(l.name === lang.name && l.level === lang.level));
      const response = await fetch(`http://localhost:8800/api/users/${clerkId}/update-profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ languages: updated }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete language');
      }
      toast.success('Language removed successfully');
      fetchLanguages();
    } catch (error) {
      console.error('Error deleting language:', error);
      toast.error((error as Error).message || 'An error occurred while removing language');
    }
  };

  const handleSave = async (form: any) => {
    setSaving(true);
    try {
      if (!form.name || !form.level) throw new Error('Please select both language and level');
      const token = await getToken();
      if (!token) throw new Error('Authentication error: Unable to get token');
      let updated: Language[];
      if (editLang) {
        // Edit existing
        updated = languages.map(l => (l.name === editLang.name && l.level === editLang.level) ? { name: form.name, level: form.level } : l);
      } else {
        // Add new
        if (languages.some(l => l.name === form.name)) throw new Error('Language already added');
        updated = [...languages, { name: form.name, level: form.level }];
      }
      const response = await fetch(`http://localhost:8800/api/users/${clerkId}/update-profile`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ languages: updated }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to save language');
      }
      toast.success(editLang ? 'Language updated successfully' : 'Language added successfully');
      setOpen(false);
      setTimeout(fetchLanguages, 100); // Add a slight delay to ensure backend update
    } catch (error) {
      console.error('Error saving language:', error);
      toast.error((error as Error).message || 'An error occurred while saving language');
    } finally {
      setSaving(false);
    }
  };

  // SidebarEdit fields
  const fields = [
    {
      name: 'name',
      label: 'Add language',
      type: 'select' as const,
      value: editLang?.name || '',
      options: LANGUAGE_OPTIONS.map(l => ({ value: l, label: l })),
    },
    {
      name: 'level',
      label: 'Proficiency level',
      type: 'select' as const,
      value: editLang?.level || '',
      options: LEVEL_OPTIONS.map(l => ({ value: l, label: l })),
    },
  ];

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg flex items-center gap-2"><Globe2 className="w-5 h-5 text-blue-500" /> Languages</h3>
        {isOwner && (
          <button
            className="text-emerald-600 text-sm flex items-center gap-1 hover:underline disabled:opacity-50"
            onClick={handleAdd}
            disabled={loading}
            title="Add language"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        )}
      </div>
      {loading ? (
        <div className="text-gray-400 italic">Loading...</div>
      ) : (
        <ul className="space-y-3">
          {languages.length === 0 && <li className="text-gray-400 italic">No languages specified</li>}
          {languages.map((lang, idx) => (
            <li key={lang.name + lang.level + idx} className="p-3 rounded-lg border bg-white shadow flex items-center gap-3 justify-between">
              <div className="flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-blue-400" />
                <span className="font-medium">{lang.name}</span>
                <span className="text-gray-600 text-sm">{lang.level}</span>
              </div>
              {isOwner && (
                <div className="flex gap-2">
                  <button className="text-blue-500 hover:bg-blue-100 rounded-full p-1" onClick={() => handleEdit(lang)} title="Edit"><Edit2 className="w-4 h-4" /></button>
                  <button className="text-red-500 hover:bg-red-100 rounded-full p-1" onClick={() => handleDelete(lang)} title="Delete"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <SidebarEdit
        open={open}
        onClose={() => setOpen(false)}
        title={editLang ? 'Edit Language' : 'Add Language'}
        fields={fields}
        onSaved={handleSave}
      />
    </section>
  );
}
