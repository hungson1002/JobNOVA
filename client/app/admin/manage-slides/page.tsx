"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, MoveUp, MoveDown, Upload, X, Loader2 } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"
import { useAuth } from "@clerk/nextjs"

interface BannerSlide {
  id: number
  image: string  // base64 image data from API
  title: string
  subtitle: string
  created_at: string
  cta_link: string
}

export default function ManageSlidesPage() {
  const [slides, setSlides] = useState<BannerSlide[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedSlide, setSelectedSlide] = useState<BannerSlide | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    image: null as File | null,
    imagePreview: "",
    cta_link: ""
  })
  const { getToken } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch slides
  useEffect(() => {
    fetchSlides()
  }, [])

  const fetchSlides = async () => {
    try {
      const response = await fetch("http://localhost:8800/api/bannerSlides")
      const data = await response.json()
      if (data.success) {
        setSlides(data.banners)
      }
    } catch (error) {
      console.error("Error fetching slides:", error)
      toast.error("Failed to load slides list")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Kiểm tra kích thước file (giới hạn 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must not exceed 5MB");
        return;
      }
      // Kiểm tra loại file
      if (!file.type.startsWith('image/')) {
        toast.error("Please select an image file");
        return;
      }
      // Upload lên Cloudinary
      const uploadData = new FormData();
      uploadData.append('file', file);
      try {
        const res = await fetch('http://localhost:8800/api/cloudinary/upload', {
          method: 'POST',
          body: uploadData,
        });
        const data = await res.json();
        if (data.success && typeof data.fileUrl === 'string') {
          setFormData(prev => ({
            ...prev,
            image: data.fileUrl, // Đảm bảo là string
            imagePreview: data.fileUrl
          }));
          toast.success("Image uploaded successfully");
        } else {
          toast.error(data.message || "Failed to upload image");
        }
      } catch (err) {
        toast.error("Failed to upload image");
      }
    }
  }

  const resetForm = () => {
    setFormData({
      title: "",
      subtitle: "",
      image: null,
      imagePreview: "",
      cta_link: ""
    })
  }

  const handleAddDialogOpen = (open: boolean) => {
    setIsAddDialogOpen(open)
    if (!open) {
      resetForm()
      setFormData({
        title: "",
        subtitle: "",
        image: null,
        imagePreview: "",
        cta_link: ""
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image) {
      toast.error("Please upload an image");
      return;
    }
    setIsSubmitting(true);
    try {
      const token = await getToken();
      const payload = {
        image: formData.image, // URL Cloudinary
        title: formData.title,
        subtitle: formData.subtitle,
        cta_link: formData.cta_link,
      };
      const response = await fetch("http://localhost:8800/api/bannerSlides", {
        method: "POST",
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const resData = await response.json();
      if (resData.success) {
        toast.success("New slide added successfully");
        await fetchSlides();
        handleAddDialogOpen(false);
      } else {
        toast.error(resData.message || "Failed to add slide");
      }
    } catch (error) {
      toast.error("Failed to add slide");
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedSlide) return

    try {
      const token = await getToken()
      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('subtitle', formData.subtitle)
      formDataToSend.append('cta_link', formData.cta_link)
      if (formData.image) {
        formDataToSend.append('image', formData.image)
      }

      const response = await fetch(`http://localhost:8800/api/bannerSlides/${selectedSlide.id}`, {
        method: "PUT",
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend
      })
      const data = await response.json()
      if (data.success) {
        toast.success("Slide updated successfully")
        await fetchSlides() // Wait for slides to be fetched
        setIsEditDialogOpen(false)
        setSelectedSlide(null)
        resetForm()
      } else {
        toast.error(data.message || "Failed to update slide")
      }
    } catch (error) {
      console.error("Error updating slide:", error)
      toast.error("Failed to update slide")
    }
  }

  const handleDelete = async (id: number) => {
    setSelectedSlide(slides.find(slide => slide.id === id) || null)
    setIsDeleteDialogOpen(true)
  }

  const performDelete = async (slideId: number) => {
    try {
      const token = await getToken()
      const response = await fetch(`http://localhost:8800/api/bannerSlides/${slideId}`, {
        method: "DELETE",
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Network response was not ok')
      }

      const data = await response.json()
      if (data.success) {
        toast.success(data.message || "Slide deleted successfully")
        await fetchSlides() // Refresh danh sách sau khi xóa
        setIsDeleteDialogOpen(false)
        setSelectedSlide(null)
      } else {
        toast.error(data.message || "Failed to delete slide")
      }
    } catch (error) {
      console.error("Error deleting slide:", error)
      toast.error("Failed to delete slide")
    }
  }

  const handleMoveUp = async (id: number) => {
    const index = slides.findIndex(slide => slide.id === id)
    if (index <= 0) return // đã ở đầu
  
    // Cập nhật UI trước
    const updatedSlides = [...slides]
    const temp = updatedSlides[index]
    updatedSlides[index] = updatedSlides[index - 1]
    updatedSlides[index - 1] = temp
    setSlides(updatedSlides)
  
    try {
      const token = await getToken()
      const response = await fetch(`http://localhost:8800/api/bannerSlides/${id}/position`, {
        method: "PUT",
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ direction: 'up' })
      })
      const data = await response.json()
      if (!data.success) {
        toast.error(data.message || "Failed to move slide up")
        await fetchSlides() // fallback nếu lỗi
      } else {
        toast.success("Slide moved up successfully")
      }
    } catch (error) {
      console.error("Error moving slide up:", error)
      toast.error("Failed to move slide")
      await fetchSlides()
    }
  }
  
  const handleMoveDown = async (id: number) => {
    const index = slides.findIndex(slide => slide.id === id)
    if (index === -1 || index >= slides.length - 1) return // đã ở cuối
  
    // Cập nhật UI trước
    const updatedSlides = [...slides]
    const temp = updatedSlides[index]
    updatedSlides[index] = updatedSlides[index + 1]
    updatedSlides[index + 1] = temp
    setSlides(updatedSlides)
  
    try {
      const token = await getToken()
      const response = await fetch(`http://localhost:8800/api/bannerSlides/${id}/position`, {
        method: "PUT",
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ direction: 'down' })
      })
      const data = await response.json()
      if (!data.success) {
        toast.error(data.message || "Failed to move slide down")
        await fetchSlides() // fallback nếu lỗi
      } else {
        toast.success("Slide moved down successfully")
      }
    } catch (error) {
      console.error("Error moving slide down:", error)
      toast.error("Failed to move slide")
      await fetchSlides()
    }
  }
  

  const openEditDialog = (slide: BannerSlide) => {
    setSelectedSlide(slide)
    setFormData({
      title: slide.title,
      subtitle: slide.subtitle,
      image: null,
      imagePreview: slide.image,
      cta_link: slide.cta_link || ""
    })
    setIsEditDialogOpen(true)
  }

  return (
    <div className="container max-w-5xl mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold text-emerald-700 tracking-tight mb-2">Manage Banner Slides</h1>
          <p className="text-lg text-gray-500">Add, edit, reorder, or remove homepage banner slides. Make your platform more attractive!</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="rounded-xl px-6 py-2 text-base font-semibold bg-amber-400 hover:bg-amber-500 text-white flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add New Slide
        </Button>
      </div>
      <div className="rounded-2xl bg-white dark:bg-gray-950 overflow-x-auto border border-gray-100">
        <Table>
          <TableHeader className="bg-emerald-50/60 dark:bg-gray-900">
            <TableRow>
              <TableHead className="text-lg font-semibold text-gray-700">Image</TableHead>
              <TableHead className="text-lg font-semibold text-gray-700">Title</TableHead>
              <TableHead className="text-lg font-semibold text-gray-700">Subtitle</TableHead>
              <TableHead className="text-lg font-semibold text-gray-700">CTA Link</TableHead>
              <TableHead className="text-lg font-semibold text-gray-700">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {slides.length > 0 ? (
              slides.map((slide) => (
                <TableRow key={slide.id} className="hover:bg-amber-50/40 transition group">
                  <TableCell>
                    <div className="w-32 h-20 rounded-xl overflow-hidden border bg-gray-100 flex items-center justify-center">
                      {slide.image ? (
                        <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs text-gray-400">No Image</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-base text-gray-800 max-w-[180px] truncate">{slide.title}</TableCell>
                  <TableCell className="text-gray-600 max-w-[220px] truncate">{slide.subtitle}</TableCell>
                  <TableCell className="text-blue-600 underline max-w-[180px] truncate">{slide.cta_link}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" className="hover:bg-emerald-50" onClick={() => openEditDialog(slide)} title="Edit">
                        <Pencil className="w-5 h-5 text-emerald-600" />
                      </Button>
                      <Button size="icon" variant="ghost" className="hover:bg-red-50" onClick={() => handleDelete(slide.id)} title="Delete">
                        <Trash2 className="w-5 h-5 text-red-500" />
                      </Button>
                      <Button size="icon" variant="ghost" className="hover:bg-gray-50" onClick={() => handleMoveUp(slide.id)} title="Move Up">
                        <MoveUp className="w-5 h-5 text-gray-500" />
                      </Button>
                      <Button size="icon" variant="ghost" className="hover:bg-gray-50" onClick={() => handleMoveDown(slide.id)} title="Move Down">
                        <MoveDown className="w-5 h-5 text-gray-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-gray-400 text-lg">
                  No slides found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Slide Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl border-2 border-amber-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-emerald-700">Add New Slide</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="slide-title">Title</Label>
              <Input id="slide-title" placeholder="Enter slide title" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} required className="rounded-xl mt-1" />
            </div>
            <div>
              <Label htmlFor="slide-subtitle">Subtitle</Label>
              <Input id="slide-subtitle" placeholder="Enter slide subtitle" value={formData.subtitle} onChange={e => setFormData(prev => ({ ...prev, subtitle: e.target.value }))} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label htmlFor="slide-image">Image</Label>
              <Input id="slide-image" type="file" accept="image/*" onChange={handleImageChange} className="rounded-xl mt-1" />
              {formData.imagePreview && (
                <div className="mt-3 w-full h-40 rounded-xl overflow-hidden border bg-gray-100 flex items-center justify-center">
                  <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="slide-cta">CTA Link</Label>
              <Input id="slide-cta" placeholder="Enter call-to-action link (e.g. /search)" value={formData.cta_link} onChange={e => setFormData(prev => ({ ...prev, cta_link: e.target.value }))} className="rounded-xl mt-1" />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)} className="rounded-xl" disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-2" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? "Adding..." : "Add Slide"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Slide Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg rounded-2xl border-2 border-amber-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-emerald-700">Edit Slide</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-6">
            <div>
              <Label htmlFor="edit-slide-title">Title</Label>
              <Input id="edit-slide-title" placeholder="Enter slide title" value={formData.title} onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))} required className="rounded-xl mt-1" />
            </div>
            <div>
              <Label htmlFor="edit-slide-subtitle">Subtitle</Label>
              <Input id="edit-slide-subtitle" placeholder="Enter slide subtitle" value={formData.subtitle} onChange={e => setFormData(prev => ({ ...prev, subtitle: e.target.value }))} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label htmlFor="edit-slide-image">Image</Label>
              <Input id="edit-slide-image" type="file" accept="image/*" onChange={handleImageChange} className="rounded-xl mt-1" />
              {formData.imagePreview && (
                <div className="mt-3 w-full h-40 rounded-xl overflow-hidden border bg-gray-100 flex items-center justify-center">
                  <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="edit-slide-cta">CTA Link</Label>
              <Input id="edit-slide-cta" placeholder="Enter call-to-action link (e.g. /search)" value={formData.cta_link} onChange={e => setFormData(prev => ({ ...prev, cta_link: e.target.value }))} className="rounded-xl mt-1" />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)} className="rounded-xl">Cancel</Button>
              <Button type="submit" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Slide Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl border-2 border-red-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600">Delete Slide</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-gray-700">Are you sure you want to delete this slide? This action cannot be undone.</div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" type="button" onClick={() => setIsDeleteDialogOpen(false)} className="rounded-xl">Cancel</Button>
            <Button type="button" className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold" onClick={() => performDelete(selectedSlide?.id!)}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 