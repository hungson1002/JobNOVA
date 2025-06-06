import { useEffect, useState } from 'react';
import SidebarEdit from './SidebarEdit';
import { Plus, Edit2, Trash2, Award } from 'lucide-react';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';

interface Certification {
  id: number;
  name: string;
  organization?: string;
  year?: number;
  description?: string;
}

export default function CertificationSection({ clerkId, isOwner = false }: { clerkId: string, isOwner?: boolean }) {
  const [list, setList] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editCert, setEditCert] = useState<any>(null);
  const [loading, setLoading] = useState(true); // for fetching list
  const [saving, setSaving] = useState(false); // for saving new/edit
  const { getToken } = useAuth();

  const fetchCertifications = async () => {
    setLoading(true);
    try {
      // Use backend URL directly
      const res = await fetch(`http://localhost:8800/api/users/${clerkId}`);
      if (!res.ok) {
        throw new Error(`Failed to fetch certifications: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      // Try both possible property names
      const certifications = data.Certifications || data.Certification || [];
      setList(Array.isArray(certifications) ? certifications : []);
    } catch (err) {
      console.error('Error fetching certifications:', err);
      toast.error('Failed to load certification data.');
      setList([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCertifications(); }, [clerkId, open]);

  const handleEdit = (cert: any) => {
    setEditCert(cert);
    setOpen(true);
  };

  const handleAdd = () => {
    console.log('Add certification button clicked');
    setEditCert(null);
    setOpen(true);
  };

  const handleDelete = async (certId: number) => {
    try {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication error: Unable to get token');
      }

      const response = await fetch(`http://localhost:8800/api/users/${clerkId}/delete-certification/${certId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete certification');
      }

      toast.success('Certification deleted successfully');
      fetchCertifications();
    } catch (error) {
      console.error('Error deleting certification:', error);
      toast.error((error as Error).message || 'An error occurred while deleting certification');
    }
  };

  const handleSave = async (form: any) => {
    setSaving(true);
    try {
      // Validation
      if (!form.name) {
        throw new Error('Certification name is required');
      }

      const token = await getToken();
      if (!token) {
        throw new Error('Authentication error: Unable to get token');
      }

      const requestBody = {
        name: form.name.trim(),
        organization: form.organization?.trim(),
        year: form.year ? parseInt(form.year) : null,
        description: form.description?.trim()
      };

      let response, data;
      if (editCert) {
        // Update existing certification
        response = await fetch(`http://localhost:8800/api/users/${clerkId}/update-certification/${editCert.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });
        data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to update certification');
        }
        toast.success('Certification updated successfully');
      } else {
        // Add new certification
        response = await fetch(`http://localhost:8800/api/users/${clerkId}/add-certification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });
        data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || 'Failed to add certification');
        }
        toast.success('Certification added successfully');
      }
      setOpen(false);
      fetchCertifications();
    } catch (error) {
      console.error('Error saving certification:', error);
      toast.error((error as Error).message || 'An error occurred while saving certification');
    } finally {
      setSaving(false);
    }
  };

  // SidebarEdit fields
  const fields = [
    { name: "name", label: "Name", value: editCert?.name || "" },
    { name: "organization", label: "Organization", value: editCert?.organization || "" },
    { name: "year", label: "Year", value: editCert?.year ? String(editCert.year) : "" },
    { name: "description", label: "Description", value: editCert?.description || "" }
  ];

  // Debug: log modal state
  console.log('SidebarEdit rendered, open:', open, 'editCert:', editCert);

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg flex items-center gap-2"><Award className="w-5 h-5 text-amber-500" /> Certifications</h3>
        {isOwner && (
          <button
            className="text-emerald-600 text-sm disabled:opacity-50"
            onClick={handleAdd}
            disabled={loading}
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        )}
      </div>
      {loading ? (
        <div className="text-gray-400 italic">Loading...</div>
      ) : (
        <ul className="space-y-3">
          {list.length === 0 && <li className="text-gray-400 italic">No certifications yet.</li>}
          {list.map(cert => (
            <li key={cert.id} className="p-4 rounded-lg border bg-white shadow flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                <span className="font-bold text-base">{cert.name}</span>
              </div>
              {cert.organization && (
                <div className="text-gray-700 text-sm">
                  Organization: {cert.organization}
                </div>
              )}
              {cert.year && (
                <div className="text-gray-500 text-sm">Year: {cert.year}</div>
              )}
              {cert.description && (
                <div className="text-gray-600 text-sm mt-1">{cert.description}</div>
              )}
              {isOwner && (
                <div className="mt-2 flex gap-2">
                  <button className="px-3 py-1 border rounded text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-1" onClick={() => handleEdit(cert)} title="Edit certification">
                    <Edit2 className="w-4 h-4" /> Edit certification
                  </button>
                  <button className="px-3 py-1 border rounded text-sm text-red-600 hover:bg-red-50 flex items-center gap-1" onClick={() => handleDelete(cert.id)} title="Delete certification">
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
        title={editCert ? "Edit Certification" : "Add Certification"}
        fields={fields}
        onSaved={handleSave}
      />
    </section>
  );
}
