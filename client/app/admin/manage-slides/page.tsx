"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, MoveUp, MoveDown, Upload, X } from "lucide-react"
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
      toast.error("Không thể tải danh sách slides")
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Kiểm tra kích thước file (giới hạn 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Kích thước ảnh không được vượt quá 5MB")
        return
      }

      // Kiểm tra loại file
      if (!file.type.startsWith('image/')) {
        toast.error("Vui lòng chọn file ảnh")
        return
      }

      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          image: file,
          imagePreview: reader.result as string
        }))
      }
      reader.readAsDataURL(file)
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
    e.preventDefault()
    if (!formData.image) {
      toast.error("Vui lòng chọn ảnh")
      return
    }

    try {
      const token = await getToken()

      const formDataToSend = new FormData()
      formDataToSend.append('title', formData.title)
      formDataToSend.append('subtitle', formData.subtitle)
      formDataToSend.append('image', formData.image)
      formDataToSend.append('cta_link', formData.cta_link)

      const response = await fetch("http://localhost:8800/api/bannerSlides", {
        method: "POST",
        credentials: 'include',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend
      })
      const data = await response.json()
      if (data.success) {
        toast.success("Slide mới đã được thêm vào danh sách")
        await fetchSlides() // Wait for slides to be fetched
        handleAddDialogOpen(false) // Close dialog and reset form
      } else {
        toast.error(data.message || "Không thể thêm slide")
      }
    } catch (error) {
      console.error("Error adding slide:", error)
      toast.error("Không thể thêm slide")
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
        toast.success("Thông tin slide đã được cập nhật")
        await fetchSlides() // Wait for slides to be fetched
        setIsEditDialogOpen(false)
        setSelectedSlide(null)
        resetForm()
      } else {
        toast.error(data.message || "Không thể cập nhật slide")
      }
    } catch (error) {
      console.error("Error updating slide:", error)
      toast.error("Không thể cập nhật slide")
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
        toast.success(data.message || "Đã xóa slide")
        await fetchSlides() // Refresh danh sách sau khi xóa
        setIsDeleteDialogOpen(false)
        setSelectedSlide(null)
      } else {
        toast.error(data.message || "Không thể xóa slide")
      }
    } catch (error) {
      console.error("Error deleting slide:", error)
      toast.error("Không thể xóa slide")
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
        toast.error(data.message || "Không thể di chuyển slide lên")
        await fetchSlides() // fallback nếu lỗi
      } else {
        toast.success("Đã di chuyển slide lên")
      }
    } catch (error) {
      console.error("Error moving slide up:", error)
      toast.error("Không thể di chuyển slide")
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
        toast.error(data.message || "Không thể di chuyển slide xuống")
        await fetchSlides() // fallback nếu lỗi
      } else {
        toast.success("Đã di chuyển slide xuống")
      }
    } catch (error) {
      console.error("Error moving slide down:", error)
      toast.error("Không thể di chuyển slide")
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
    <div className="p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Quản lý Banner Slides</CardTitle>
              <CardDescription>
                Thêm, sửa, xóa và sắp xếp các banner slides trên trang chủ
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Thêm Slide Mới
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Thêm Banner Slide Mới</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Tiêu đề</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="subtitle">Mô tả</Label>
                    <Input
                      id="subtitle"
                      value={formData.subtitle}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cta_link">CTA Link</Label>
                    <Input
                      id="cta_link"
                      value={formData.cta_link || ''}
                      onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                      placeholder="https://example.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="image">Hình ảnh</Label>
                    <div className="mt-2 flex items-center gap-4">
                      <div className="relative flex-1">
                        <Input
                          id="image"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          onClick={() => document.getElementById('image')?.click()}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Chọn ảnh
                        </Button>
                      </div>
                      {formData.imagePreview && (
                        <div className="relative h-20 w-32">
                          <Image
                            src={formData.imagePreview}
                            alt="Preview"
                            fill
                            className="rounded object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute -right-2 -top-2 h-6 w-6"
                            onClick={() => setFormData({ ...formData, image: null, imagePreview: "" })}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => handleAddDialogOpen(false)}>
                      Hủy
                    </Button>
                    <Button type="submit">Thêm</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hình ảnh</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead>Ngày tạo</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : slides.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Chưa có banner slides nào
                  </TableCell>
                </TableRow>
              ) : (
                slides.map((slide) => (
                  <TableRow key={slide.id}>
                    <TableCell>
                      <div className="relative h-16 w-24 overflow-hidden rounded">
                        <Image
                          src={slide.image}
                          alt={slide.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell>{slide.title}</TableCell>
                    <TableCell>{slide.subtitle}</TableCell>
                    <TableCell>{new Date(slide.created_at).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" onClick={() => openEditDialog(slide)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleDelete(slide.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleMoveUp(slide.id)}>
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" onClick={() => handleMoveDown(slide.id)}>
                          <MoveDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chỉnh sửa Banner Slide</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Tiêu đề</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-subtitle">Mô tả</Label>
              <Input
                id="edit-subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-cta_link">CTA Link</Label>
              <Input
                id="edit-cta_link"
                value={formData.cta_link || ''}
                onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
                placeholder="https://example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-image">Hình ảnh</Label>
              <div className="mt-2 flex items-center gap-4">
                <div className="relative flex-1">
                  <Input
                    id="edit-image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => document.getElementById('edit-image')?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Chọn ảnh mới
                  </Button>
                </div>
                {formData.imagePreview && (
                  <div className="relative h-20 w-32">
                    <Image
                      src={formData.imagePreview}
                      alt="Preview"
                      fill
                      className="rounded object-cover"
                    />
                    {formData.image && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -right-2 -top-2 h-6 w-6"
                        onClick={() => setFormData({ ...formData, image: null, imagePreview: selectedSlide?.image || "" })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit">Lưu thay đổi</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Bạn có chắc chắn muốn xóa slide này?</p>
            {selectedSlide && (
              <div className="mt-4">
                <p className="font-medium">Tiêu đề: {selectedSlide.title}</p>
                <p className="text-sm text-gray-500">Ngày tạo: {new Date(selectedSlide.created_at).toLocaleDateString("vi-VN")}</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false)
                setSelectedSlide(null)
              }}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedSlide && performDelete(selectedSlide.id)}
            >
              Xóa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 