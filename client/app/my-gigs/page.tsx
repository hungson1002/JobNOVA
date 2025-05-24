"use client"

import React, { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Trash2, MoreVertical } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface Gig {
  id: number;
  title: string;
  description: string;
  category_id: number;
  job_type_id: number;
  starting_price: number;
  delivery_time: number;
  gig_image: string;
  city: string;
  country: string;
  status: string;
  created_at: string;
  category?: {
    id: number;
    name: string;
  };
  job_type?: {
    id: number;
    job_type: string;
  };
  gig_images?: string[];
  seller?: {
    firstname?: string;
    lastname?: string;
    username?: string;
  };
}

export default function MyGigsPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { getToken } = useAuth();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    starting_price: "",
    delivery_time: "",
    city: "",
    country: ""
  });
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    const fetchGigs = async () => {
      setLoading(true);
      const res = await fetch(`http://localhost:8800/api/gigs?seller_clerk_id=${user.id}`);
      const data = await res.json();
      setGigs(data.gigs || []);
      setLoading(false);
    };
    fetchGigs();
  }, [isLoaded, isSignedIn, user]);

  const handleEdit = (gig: Gig) => {
    setSelectedGig(gig);
    setEditForm({
      title: gig.title,
      description: gig.description,
      starting_price: gig.starting_price.toString(),
      delivery_time: gig.delivery_time.toString(),
      city: gig.city,
      country: gig.country
    });
    setShowEditModal(true);
  };

  const handleDelete = (gig: Gig) => {
    setSelectedGig(gig);
    setShowDeleteAlert(true);
  };

  const handleEditSubmit = async () => {
    if (!selectedGig) return;
    try {
      const response = await fetch(`http://localhost:8800/api/gigs/${selectedGig.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getToken()}`,
        },
        body: JSON.stringify({
          ...editForm,
          starting_price: parseFloat(editForm.starting_price),
          delivery_time: parseInt(editForm.delivery_time)
        }),
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Gig updated successfully",
        });
        setGigs(prev => prev.map(gig => 
          gig.id === selectedGig.id ? {
            ...gig,
            title: editForm.title,
            description: editForm.description,
            starting_price: parseFloat(editForm.starting_price),
            delivery_time: parseInt(editForm.delivery_time),
            city: editForm.city,
            country: editForm.country
          } : gig
        ));
        setShowEditModal(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update gig",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedGig) return;
    try {
      const response = await fetch(`http://localhost:8800/api/gigs/${selectedGig.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await getToken()}`,
        }
      });
      const data = await response.json();
      if (data.success) {
        toast({
          title: "Success",
          description: "Gig deleted successfully",
        });
        setGigs(prev => prev.filter(gig => gig.id !== selectedGig.id));
        setShowDeleteAlert(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete gig",
        variant: "destructive",
      });
    }
  };

  if (!isLoaded) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  if (!isSignedIn) return <div className="flex justify-center items-center min-h-screen">Please sign in to view your gigs</div>;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center w-10 h-10 rounded border border-transparent hover:border-gray-300 hover:bg-gray-50 transition"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 text-black-600" />
          </button>
          <span className="text-2xl md:text-3xl font-bold text-black-600">My Gigs</span>
        </div>
        <Link href="/create-gig">
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">
            Create New Gig
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">Loading...</div>
      ) : gigs.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">No gigs found</h3>
          <p className="mt-2 text-sm text-gray-500">Get started by creating a new gig.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-700 text-sm">
                <th className="py-3 px-4 text-left font-semibold">Image</th>
                <th className="py-3 px-4 text-left font-semibold">Title</th>
                <th className="py-3 px-4 text-left font-semibold">Price</th>
                <th className="py-3 px-4 text-left font-semibold">Delivery</th>
                <th className="py-3 px-4 text-left font-semibold">Status</th>
                <th className="py-3 px-4 text-left font-semibold">Created</th>
                <th className="py-3 px-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {gigs.map((gig) => (
                <tr
                  key={gig.id}
                  className="border-b hover:bg-gray-50 transition cursor-pointer group"
                  onClick={e => {
                    if ((e.target as HTMLElement).closest('.gig-actions')) return;
                    router.push(`/gigs/${gig.id}`);
                  }}
                >
                  <td className="py-2 px-4">
                    {(() => {
                      let imgSrc = '/placeholder.svg';
                      if (Array.isArray(gig.gig_images) && gig.gig_images.length > 0) {
                        const firstImg = gig.gig_images.find(url => !url.match(/\.(mp4|mov|avi|wmv)$/i));
                        if (firstImg) imgSrc = firstImg;
                      } else if (gig.gig_image && gig.gig_image.startsWith('http')) {
                        imgSrc = gig.gig_image;
                      }
                      return (
                        <Image
                          src={imgSrc}
                          alt={gig.title}
                          width={80}
                          height={80}
                          className="rounded object-cover border"
                          style={{ width: 80, height: 80 }}
                        />
                      );
                    })()}
                  </td>
                  <td className="py-2 px-4 font-medium max-w-xs truncate">{gig.title}</td>
                  <td className="py-2 px-4 text-emerald-600 font-semibold">${gig.starting_price}</td>
                  <td className="py-2 px-4">{gig.delivery_time} days</td>
                  <td className="py-2 px-4">
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                      {gig.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 text-sm text-gray-500">{new Date(gig.created_at).toLocaleDateString()}</td>
                  <td className="py-2 px-4 text-center gig-actions">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8">
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-32 p-1">
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-sm"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowEditModal(true);
                            setSelectedGig(gig);
                            setEditForm({ title: gig.title, description: gig.description, starting_price: gig.starting_price.toString(), delivery_time: gig.delivery_time.toString(), city: gig.city, country: gig.country });
                          }}
                        >
                          <Pencil className="h-4 w-4" /> Edit
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100 text-sm text-red-600"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            setShowDeleteAlert(true);
                            setSelectedGig(gig);
                          }}
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </PopoverContent>
                    </Popover>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Gig</DialogTitle>
            <DialogDescription>
              Update your gig information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editForm.title}
                onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter gig title"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Input
                value={editForm.description}
                onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter gig description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Starting Price ($)</label>
                <Input
                  type="number"
                  value={editForm.starting_price}
                  onChange={(e) => setEditForm(prev => ({ ...prev, starting_price: e.target.value }))}
                  placeholder="Enter price"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Delivery Time (days)</label>
                <Input
                  type="number"
                  value={editForm.delivery_time}
                  onChange={(e) => setEditForm(prev => ({ ...prev, delivery_time: e.target.value }))}
                  placeholder="Enter days"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <Input
                  value={editForm.city}
                  onChange={(e) => setEditForm(prev => ({ ...prev, city: e.target.value }))}
                  placeholder="Enter city"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Country</label>
                <Input
                  value={editForm.country}
                  onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={handleEditSubmit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your gig.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
