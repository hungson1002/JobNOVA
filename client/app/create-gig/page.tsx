"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@clerk/nextjs"
import { toast as sonnerToast } from "sonner"

const steps = [
  { title: "Basic Info & Category", desc: "Service title, description, category & job type" },
  { title: "Pricing & Delivery", desc: "Set price & delivery time" },
  { title: "Media & Location", desc: "Upload image & set location" },
  { title: "FAQ & Requirements", desc: "Add FAQs and requirements for buyers" },
]

export default function CreateGigPage() {
  const [step, setStep] = useState(0)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [jobTypeId, setJobTypeId] = useState("")
  const [startingPrice, setStartingPrice] = useState("")
  const [deliveryTime, setDeliveryTime] = useState("")
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [gigImages, setGigImages] = useState<string[]>([])
  const [imageUploading, setImageUploading] = useState(false)
  const [error, setError] = useState("")
  const [categories, setCategories] = useState<{id: string, name: string}[]>([])
  const [jobTypes, setJobTypes] = useState<{id: string, job_type: string}[]>([])
  const [faqs, setFaqs] = useState([{ question: "", answer: "" }])
  const [gigReqTemplates, setGigReqTemplates] = useState([{ requirement_text: "", is_required: true }])
  const router = useRouter()

  // TODO: Lấy seller_clerk_id từ user context/auth
  const { getToken } = useAuth() // demo, cần thay bằng user thực tế

  useEffect(() => {
    fetch("http://localhost:8800/api/categories")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.categories)) setCategories(data.categories)
      })
    fetch("http://localhost:8800/api/job-types")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.jobTypes)) setJobTypes(data.jobTypes)
      })
  }, [])

  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    setImageUploading(true)
    setError("")
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
        setGigImages(prev => [...prev, ...data.files.map((f: any) => f.fileUrl)])
      } else {
        setError("Upload failed")
      }
    } catch (err) {
      setError("Upload failed")
    } finally {
      setImageUploading(false)
    }
  }

  // FAQ handlers
  const handleFaqChange = (idx: number, field: string, value: string) => {
    setFaqs(faqs => faqs.map((f, i) => i === idx ? { ...f, [field]: value } : f))
  }
  const addFaq = () => setFaqs(faqs => [...faqs, { question: "", answer: "" }])
  const removeFaq = (idx: number) => setFaqs(faqs => faqs.length > 1 ? faqs.filter((_, i) => i !== idx) : faqs)

  // Requirement handlers
  const handleReqTemplateChange = (idx: number, field: string, value: any) => {
    setGigReqTemplates(reqs => reqs.map((r, i) => i === idx ? { ...r, [field]: value } : r))
  }
  const addReqTemplate = () => setGigReqTemplates(reqs => [...reqs, { requirement_text: "", is_required: true }])
  const removeReqTemplate = (idx: number) => setGigReqTemplates(reqs => reqs.length > 1 ? reqs.filter((_, i) => i !== idx) : reqs)

  const validateStep = () => {
    if (step === 0 && (!title || !categoryId || !jobTypeId)) return "Title, category and job type are required."
    if (step === 1 && (!startingPrice || !deliveryTime)) return "Price and delivery time are required."
    if (step === 2 && gigImages.length === 0) return "Please upload at least one image or video."
    if (step === 3 && (faqs.some(f => !f.question.trim() || !f.answer.trim()) || gigReqTemplates.some(r => !r.requirement_text.trim()))) return "All FAQ and requirement template fields are required."
    return ""
  }

  const handleNext = () => {
    const err = validateStep()
    if (err) {
      setError(err)
      return
    }
    setError("")
    setStep(s => s + 1)
  }
  const handleBack = () => {
    setError("")
    setStep(s => s - 1)
  }
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!title || !categoryId || !jobTypeId || !startingPrice || !deliveryTime || gigImages.length === 0 || faqs.some(f => !f.question.trim() || !f.answer.trim()) || gigReqTemplates.some(r => !r.requirement_text.trim())) {
      setError("Please fill all required fields, upload at least one image/video, and complete FAQ/Requirement Templates.")
      return
    }
    const payload = {
      category_id: categoryId,
      job_type_id: jobTypeId,
      title,
      description,
      starting_price: parseFloat(startingPrice),
      delivery_time: parseInt(deliveryTime),
      gig_images: gigImages,
      city,
      country,
      faqs,
      gig_requirement_templates: gigReqTemplates,
    }
    const token = await getToken()
    try {
      const res = await fetch("http://localhost:8800/api/gigs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        sonnerToast.success("Create service successfully", {
          description: "Your gig has been submitted and is pending approval. You will be notified once it is approved."
        })
        setTimeout(() => {
          router.push("/my-gigs")
        }, 1800)
      } else {
        setError(data.message || "Create failed")
      }
    } catch (err) {
      setError("Create failed")
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 py-12 px-2">
      <form
        className="w-full max-w-xl rounded-2xl shadow-2xl bg-white dark:bg-gray-900 p-10 border border-gray-100 dark:border-gray-800 flex flex-col gap-7 animate-fade-in"
        onSubmit={handleSubmit}
      >
        {/* Stepper */}
        <div className="flex items-center justify-center gap-4 mb-6">
          {steps.map((s, idx) => (
            <div key={s.title} className="flex items-center gap-2">
              <div className={`rounded-full w-9 h-9 flex items-center justify-center text-lg font-bold transition-all duration-200
                ${step === idx ? 'bg-emerald-600 text-white scale-110 shadow-lg' : 'bg-gray-200 dark:bg-gray-800 text-gray-500'}`}>{idx + 1}</div>
              {idx < steps.length - 1 && <div className="w-8 h-1 rounded bg-gray-300 dark:bg-gray-700" />}
            </div>
          ))}
        </div>
        <div className="text-center mb-2">
          <h2 className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{steps[step].title}</h2>
          <p className="text-gray-500 dark:text-gray-400 text-base">{steps[step].desc}</p>
        </div>
        {error && <div className="mb-2 text-center text-red-500 font-semibold animate-shake">{error}</div>}
        {/* Step 1: Basic Info & Category */}
        {step === 0 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title" className="text-base font-semibold">Title <span className="text-red-500">*</span></Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. I will design a professional logo for your business" className="h-12 text-lg px-4 border-2 border-gray-200 focus:border-emerald-500 transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="description" className="text-base font-semibold">Description</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe your service in detail..." className="min-h-[120px] text-base px-4 border-2 border-gray-200 focus:border-emerald-500 transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="category" className="text-base font-semibold">Category <span className="text-red-500">*</span></Label>
              <Select value={categoryId} onValueChange={setCategoryId} required>
                <SelectTrigger id="category" className="h-12 text-lg border-2 border-gray-200 focus:border-emerald-500 transition-all">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="jobType" className="text-base font-semibold">Job Type <span className="text-red-500">*</span></Label>
              <Select value={jobTypeId} onValueChange={setJobTypeId} required>
                <SelectTrigger id="jobType" className="h-12 text-lg border-2 border-gray-200 focus:border-emerald-500 transition-all">
                  <SelectValue placeholder="Select a job type" />
                </SelectTrigger>
                <SelectContent>
                  {jobTypes.map(jt => (
                    <SelectItem key={jt.id} value={String(jt.id)}>{jt.job_type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        {/* Step 2: Pricing & Delivery */}
        {step === 1 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="startingPrice" className="text-base font-semibold">Starting Price <span className="text-red-500">*</span></Label>
              <Input id="startingPrice" type="number" value={startingPrice} onChange={e => setStartingPrice(e.target.value)} required placeholder="$" className="h-12 text-lg px-4 border-2 border-gray-200 focus:border-emerald-500 transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="deliveryTime" className="text-base font-semibold">Delivery Time (days) <span className="text-red-500">*</span></Label>
              <Input id="deliveryTime" type="number" value={deliveryTime} onChange={e => setDeliveryTime(e.target.value)} required placeholder="e.g. 3" className="h-12 text-lg px-4 border-2 border-gray-200 focus:border-emerald-500 transition-all" />
            </div>
          </div>
        )}
        {/* Step 3: Media & Location */}
        {step === 2 && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="gigImages" className="text-base font-semibold">Gig Images/Video <span className="text-red-500">*</span></Label>
              <Input id="gigImages" type="file" accept="image/*,video/*" multiple onChange={handleImagesChange} className="rounded border-2 border-gray-200 focus:border-emerald-500 transition-all" />
              {imageUploading && <div className="text-sm text-gray-500 mt-2 animate-pulse">Uploading...</div>}
              {gigImages.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {gigImages.map((url: string, idx: number) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl w-32 h-20 border-2 border-emerald-200 shadow-md overflow-hidden"
                    >
                      {url.match(/\.(mp4|mov|avi|wmv)$/i) ? (
                        <video
                          src={url}
                          className="w-full h-full object-cover"
                          controls
                        />
                      ) : (
                        <img
                          src={url}
                          alt="Gig"
                          className="w-full h-full object-cover"
                        />
                      )}
                      {/* Nút xóa chỉ hiện khi hover */}
                      <button
                        type="button"
                        onClick={() => {
                          setGigImages(gigImages => gigImages.filter((_, i) => i !== idx));
                        }}
                        className="absolute top-1 right-1 bg-white bg-opacity-80 rounded-full p-1 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        style={{ zIndex: 10 }}
                        title="Xóa ảnh/video"
                      >
                        &#10005;
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="city" className="text-base font-semibold">City</Label>
              <Input id="city" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Hanoi" className="h-12 text-lg px-4 border-2 border-gray-200 focus:border-emerald-500 transition-all" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="country" className="text-base font-semibold">Country</Label>
              <Input id="country" value={country} onChange={e => setCountry(e.target.value)} placeholder="e.g. Vietnam" className="h-12 text-lg px-4 border-2 border-gray-200 focus:border-emerald-500 transition-all" />
            </div>
          </div>
        )}
        {/* Step 4: FAQ & Requirements */}
        {step === 3 && (
          <div className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <Label className="text-base font-semibold">FAQs <span className="text-red-500">*</span></Label>
              {faqs.map((faq, idx) => (
                <div key={idx} className="flex flex-col md:flex-row gap-2 items-start md:items-center mb-2 border-b pb-3">
                  <Input
                    placeholder="Question"
                    value={faq.question}
                    onChange={e => handleFaqChange(idx, "question", e.target.value)}
                    className="flex-1 text-base px-3 border-2 border-gray-200 focus:border-emerald-500 transition-all"
                  />
                  <Input
                    placeholder="Answer"
                    value={faq.answer}
                    onChange={e => handleFaqChange(idx, "answer", e.target.value)}
                    className="flex-1 text-base px-3 border-2 border-gray-200 focus:border-emerald-500 transition-all"
                  />
                  <Button type="button" variant="destructive" className="h-10 px-3" onClick={() => removeFaq(idx)} disabled={faqs.length === 1}>Remove</Button>
                </div>
              ))}
              <Button type="button" variant="outline" className="w-full mt-2" onClick={addFaq}>Add FAQ</Button>
            </div>
            <div className="flex flex-col gap-2">
              <Label className="text-base font-semibold">Requirement Templates <span className="text-red-500">*</span></Label>
              {gigReqTemplates.map((req, idx) => (
                <div key={idx} className="flex gap-2 items-center mb-2 border-b pb-3">
                  <Input
                    placeholder="Requirement for buyer"
                    value={req.requirement_text}
                    onChange={e => handleReqTemplateChange(idx, "requirement_text", e.target.value)}
                    className="flex-1 text-base px-3 border-2 border-gray-200 focus:border-emerald-500 transition-all"
                  />
                  <label className="flex items-center gap-1">
                    <input type="checkbox" checked={req.is_required} onChange={e => handleReqTemplateChange(idx, "is_required", e.target.checked)} /> Required
                  </label>
                  <Button type="button" variant="destructive" className="h-10 px-3" onClick={() => removeReqTemplate(idx)} disabled={gigReqTemplates.length === 1}>Remove</Button>
                </div>
              ))}
              <Button type="button" variant="outline" className="w-full mt-2" onClick={addReqTemplate}>Add Requirement Template</Button>
            </div>
          </div>
        )}
        {/* Step navigation */}
        <div className="flex items-center justify-between gap-4 mt-2">
          {step > 0 ? (
            <Button type="button" variant="outline" className="rounded-lg px-6 py-2 text-base font-semibold" onClick={handleBack}>Back</Button>
          ) : <div />}
          {step < steps.length - 1 ? (
            <Button type="button" className="rounded-lg px-6 py-2 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg" onClick={handleNext}>Next</Button>
          ) : (
            <Button type="submit" className="rounded-lg px-6 py-2 text-base font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg">Create Gig</Button>
          )}
        </div>
      </form>
    </main>
  )
}
