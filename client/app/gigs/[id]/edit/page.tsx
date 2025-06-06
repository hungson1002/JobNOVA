"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, ImageIcon, Plus, Trash2, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export default function EditGigPage({ params }: { params: { id: string } }) {
  const [gig, setGig] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<any>({
    title: "",
    description: "",
    starting_price: "",
    delivery_time: "",
    city: "",
    country: "",
    gig_images: [] as string[],
  })
  const [imageUploading, setImageUploading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Fetch gig data
    fetch(`http://localhost:8800/api/gigs/${params.id}`)
      .then(res => res.json())
      .then(data => {
        setGig(data.gig)
        setForm({
          title: data.gig.title || "",
          description: data.gig.description || "",
          starting_price: data.gig.starting_price?.toString() || "",
          delivery_time: data.gig.delivery_time?.toString() || "",
          city: data.gig.city || "",
          country: data.gig.country || "",
          gig_images: data.gig.gig_images || [],
        })
      })
      .finally(() => setLoading(false))
  }, [params.id])

  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setImageUploading(true)
    try {
      const formData = new FormData()
      Array.from(e.target.files).forEach(file => {
        formData.append("files", file)
      })
      const res = await fetch("http://localhost:8800/api/cloudinary/upload-multiple", {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (data.success) {
        setForm((prev: any) => ({
          ...prev,
          gig_images: [...prev.gig_images, ...data.files.map((f: any) => f.fileUrl)],
        }))
      }
    } finally {
      setImageUploading(false)
    }
  }

  const handleRemoveImage = (idx: number) => {
    setForm((prev: any) => ({
      ...prev,
      gig_images: prev.gig_images.filter((_: any, i: number) => i !== idx),
    }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch(`http://localhost:8800/api/gigs/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          starting_price: parseFloat(form.starting_price),
          delivery_time: parseInt(form.delivery_time),
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast({ title: "Gig updated successfully", variant: "default" })
        router.push(`/gigs/${params.id}`)
      } else {
        toast({ title: "Update failed", description: data.message || "Update failed", variant: "destructive" })
      }
    } catch (err) {
      toast({ title: "Update failed", description: "Update failed", variant: "destructive" })
    }
  }

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>

  return (
    <div className="container mx-auto py-10 px-4 md:px-6">
      <div className="flex items-center mb-8">
        <Link href={`/gigs/${params.id}`} className="mr-4">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold dark:text-white">Edit Gig</h1>
      </div>

      <Tabs defaultValue="overview" className="mb-10">
        <TabsList className="grid grid-cols-4 mb-8 w-full max-w-3xl mx-auto">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl dark:text-white">Gig Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <label htmlFor="gig-title" className="block font-medium mb-2 dark:text-white">
                  Gig Title
                </label>
                <Input id="gig-title" placeholder="I will..." value={form.title} onChange={handleChange} className="max-w-2xl h-12" />
                <p className="text-xs text-gray-500 mt-2 dark:text-gray-400">
                  Clearly describe what you are offering (max 80 characters)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="category" className="block font-medium mb-2 dark:text-white">
                    Category
                  </label>
                  <Select defaultValue={gig?.category}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Graphics & Design">Graphics & Design</SelectItem>
                      <SelectItem value="Digital Marketing">Digital Marketing</SelectItem>
                      <SelectItem value="Writing & Translation">Writing & Translation</SelectItem>
                      <SelectItem value="Video & Animation">Video & Animation</SelectItem>
                      <SelectItem value="Programming & Tech">Programming & Tech</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label htmlFor="subcategory" className="block font-medium mb-2 dark:text-white">
                    Subcategory
                  </label>
                  <Select defaultValue={gig?.subcategory}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Logo Design">Logo Design</SelectItem>
                      <SelectItem value="Brand Style Guides">Brand Style Guides</SelectItem>
                      <SelectItem value="Business Cards">Business Cards</SelectItem>
                      <SelectItem value="Social Media Design">Social Media Design</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label htmlFor="tags" className="block font-medium mb-2 dark:text-white">
                  Search Tags
                </label>
                <Input
                  id="tags"
                  placeholder="Add search terms that buyers would use to find your service"
                  defaultValue={gig?.tags.join(", ")}
                  className="max-w-2xl h-12"
                />
                <p className="text-xs text-gray-500 mt-2 dark:text-gray-400">Enter up to 5 tags separated by commas</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing">
          <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl dark:text-white">Packages & Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {["basic", "standard", "premium"].map((tier) => (
                  <Card
                    key={tier}
                    className={`border-2 ${
                      tier === "basic"
                        ? "border-gray-200 dark:border-gray-700"
                        : tier === "standard"
                          ? "border-emerald-100 dark:border-emerald-900"
                          : "border-purple-100 dark:border-purple-900"
                    }`}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg capitalize dark:text-white">{tier}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      <div>
                        <label htmlFor={`price-${tier}`} className="block text-sm font-medium mb-2 dark:text-gray-200">
                          Price ($)
                        </label>
                        <Input
                          id={`price-${tier}`}
                          type="number"
                          defaultValue={gig?.price[tier as keyof typeof gig.price]}
                          className="h-12"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor={`delivery-${tier}`}
                          className="block text-sm font-medium mb-2 dark:text-gray-200"
                        >
                          Delivery Time (days)
                        </label>
                        <Select defaultValue={gig?.delivery[tier as keyof typeof gig.delivery].toString()}>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5, 7, 10, 14, 21, 30].map((day) => (
                              <SelectItem key={day} value={day.toString()}>
                                {day} {day === 1 ? "day" : "days"}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label
                          htmlFor={`revisions-${tier}`}
                          className="block text-sm font-medium mb-2 dark:text-gray-200"
                        >
                          Revisions
                        </label>
                        <Select defaultValue={gig?.revisions[tier as keyof typeof gig.revisions].toString()}>
                          <SelectTrigger className="h-12">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[0, 1, 2, 3, 4, 5, 10, "Unlimited"].map((rev) => (
                              <SelectItem key={rev.toString()} value={rev.toString()}>
                                {rev === 0
                                  ? "No revisions"
                                  : rev === 1
                                    ? "1 revision"
                                    : rev === "Unlimited"
                                      ? "Unlimited"
                                      : `${rev} revisions`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="description">
          <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl dark:text-white">Description & Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <label htmlFor="description" className="block font-medium mb-2 dark:text-white">
                  Gig Description
                </label>
                <Textarea
                  id="description"
                  placeholder="Describe your service in detail..."
                  value={form.description}
                  onChange={handleChange}
                  className="min-h-[200px]"
                />
                <p className="text-xs text-gray-500 mt-2 dark:text-gray-400">
                  Min. 120 characters - Describe what you offer, your process, and why buyers should choose you
                </p>
              </div>

              <Separator className="my-8" />

              <div>
                <h3 className="font-medium mb-4 dark:text-white">Frequently Asked Questions</h3>
                <div className="space-y-5 mb-6">
                  <div className="p-5 border rounded-xl dark:border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <Input
                        placeholder="Question"
                        defaultValue="How many logo concepts will I receive?"
                        className="mb-3 h-12"
                      />
                      <Button variant="ghost" size="icon" className="text-red-500 ml-2">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Answer"
                      defaultValue="With the standard package, you'll receive 3 initial concepts to choose from. The premium package includes 5 concepts."
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="p-5 border rounded-xl dark:border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <Input placeholder="Question" defaultValue="Do you provide source files?" className="mb-3 h-12" />
                      <Button variant="ghost" size="icon" className="text-red-500 ml-2">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Answer"
                      defaultValue="Yes, all packages include the source files (AI, EPS, PDF) along with PNG and JPG formats."
                      className="min-h-[100px]"
                    />
                  </div>
                </div>

                <Button variant="outline" className="flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Add FAQ
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          <Card className="border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl dark:text-white">Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {form.gig_images.map((url: string, idx: number) => (
                    <div key={idx} className="relative group">
                      <img
                        src={url}
                        alt={`Gallery item ${idx + 1}`}
                        className="w-full aspect-video object-cover rounded-lg"
                      />
                      <button
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <label className="relative flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-500 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">Images or videos (max 500MB each)</p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      multiple
                      accept="image/*"
                      onChange={handleImagesChange}
                      disabled={imageUploading}
                    />
                  </label>
                </div>
                {imageUploading && (
                  <div className="text-center text-sm text-gray-500">
                    Uploading files...
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between items-center max-w-6xl mx-auto">
        <Button variant="outline" className="px-6">
          Preview Gig
        </Button>
        <div className="space-x-4">
          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Delete Gig
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 px-6" onClick={handleSubmit}>Save Changes</Button>
        </div>
      </div>
    </div>
  )
}
