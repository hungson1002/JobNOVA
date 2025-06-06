import { useEffect, useState } from 'react';
import SidebarEdit from './SidebarEdit';
import { Plus, Edit2, Trash2, GraduationCap } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

interface Education {
  id: number;
  school: string;
  degree: string;
  major?: string;
  year_of_graduation?: number;
  country?: string;
}

export default function EducationSection({ clerkId, isOwner = false }: { clerkId: string, isOwner?: boolean }) {
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editEdu, setEditEdu] = useState<any>(null);
  const [loading, setLoading] = useState(true); // for fetching list
  const [saving, setSaving] = useState(false); // for saving new/edit
  const { getToken } = useAuth();

  const fetchEducations = async () => {
    setLoading(true);
    try {
      // Use backend URL directly
      const res = await fetch(`http://localhost:8800/api/users/${clerkId}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch educations: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      // Try both possible property names
      const educations = data.Educations || data.Education || [];
      setList(Array.isArray(educations) ? educations : []);
    } catch (err) {
      console.error('Error fetching educations:', err);
      toast.error('Failed to load education data.');
      setList([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchEducations(); }, [clerkId, open]);

  const handleEdit = (edu: any) => {
    setEditEdu(edu);
    setOpen(true);
  };

  const handleAdd = () => {
    console.log('Add button clicked');
    setEditEdu(null);
    setOpen(true);
  };

  const handleDelete = async (eduId: number) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication error: Unable to get token');
      }

      const response = await fetch(`http://localhost:8800/api/users/${clerkId}/delete-education/${eduId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete education');
      }

      toast.success('Education deleted successfully');
      fetchEducations();
    } catch (error) {
      console.error('Error deleting education:', error);
      toast.error((error as Error).message || 'An error occurred while deleting education');
    }
  };

  const handleSave = async (form: any) => {
    setSaving(true);
    try {
      // Validation
      if (!form.school || !form.degree) {
        throw new Error('School and degree are required');
      }

      const token = await getToken();
      if (!token) {
        throw new Error('Authentication error: Unable to get token');
      }

      const requestBody = {
        school: form.school.trim(),
        degree: form.degree.trim(),
        major: form.major?.trim(),
        year_of_graduation: form.year_of_graduation ? parseInt(form.year_of_graduation) : null,
        country: form.country?.trim()
      };

      let response, data;
      if (editEdu) {
        // Update existing education
        response = await fetch(`http://localhost:8800/api/users/${clerkId}/update-education/${editEdu.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });
        data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to update education');
        }
        toast.success('Education updated successfully');
      } else{
        // Add new education
        response = await fetch(`http://localhost:8800/api/users/${clerkId}/add-education`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });
        data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to add education');
        }
        toast.success('Education added successfully');
      }
      setOpen(false);
      fetchEducations();
    } catch (error) {
      console.error('Error saving education:', error);
      toast.error((error as Error).message || 'An error occurred while saving education');
    } finally {
      setSaving(false);
    }
  };

  // SidebarEdit fields
  const fields = [
    { name: "school", label: "School", value: editEdu?.school || "" },
    { name: "degree", label: "Degree", value: editEdu?.degree || "" },
    { name: "year_of_graduation", label: "Year", value: editEdu?.year_of_graduation ? String(editEdu.year_of_graduation) : "" },
    { name: "major", label: "Major", value: editEdu?.major || "" },
    { name: "country", label: "Country", value: editEdu?.country || "" }
  ];

  // Debug: log modal state
  console.log('SidebarEdit rendered, open:', open, 'editEdu:', editEdu);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg flex items-center gap-2"><GraduationCap className="w-5 h-5 text-blue-500" /> Education</h3>
        {isOwner && (
          <button
            className="text-emerald-600 text-sm flex items-center gap-1 hover:underline disabled:opacity-50"
            onClick={handleAdd}
            disabled={loading}
            title="Add education"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        )}
      </div>
      {loading ? (
        <div className="text-gray-400 italic">Loading...</div>
      ) : (
        <ul className="space-y-3">
          {list.length === 0 && <li className="text-gray-400 italic">No education yet.</li>}
          {list.map(edu => (
            <li key={edu.id} className="p-4 rounded-lg border bg-white shadow flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-base">{edu.school}</span>
              </div>
              <div className="text-gray-700 text-sm">
                {edu.degree}
                {edu.major && <span className="ml-1">. {edu.major}</span>}
              </div>
              {edu.year_of_graduation && (
                <div className="text-gray-500 text-sm">Graduated {edu.year_of_graduation}</div>
              )}
              {isOwner && (
                <div className="mt-2 flex gap-2">
                  <button className="px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-1" onClick={() => handleEdit(edu)} title="Edit education">
                    <Edit2 className="w-4 h-4" /> Edit education
                  </button>
                  <button className="px-3 py-1 border rounded text-sm text-red-600 hover:bg-red-50 flex items-center gap-1" onClick={() => handleDelete(edu.id)} title="Delete education">
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <SidebarEdit
        open={open}
        onClose={() => setOpen(false)}
        title={editEdu ? "Edit Education" : "Add Education"}
        fields={fields}
        onSaved={handleSave}
      />
    </section>
  );
}
