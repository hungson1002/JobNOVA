'use client';
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@clerk/nextjs";
import { Upload } from "lucide-react";

export default function MyGigEditPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const gigId = searchParams.get("id");
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>({
    title: "",
    description: "",
    starting_price: "",
    delivery_time: "",
    city: "",
    country: "",
    gig_images: [] as string[],
  });
  const [imageUploading, setImageUploading] = useState(false);
  const [previewImages, setPreviewImages] = useState<string[]>([]);

  useEffect(() => {
    if (!gigId) return;
    (async () => {
      const token = await getToken();
      if (!token) { toast.error("Unable to get authentication token"); return; }
      const res = await fetch(`http://localhost:8800/api/gigs/${gigId}`, 
      { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setForm({
        title: data.gig.title || "",
        description: data.gig.description || "",
        starting_price: data.gig.starting_price?.toString() || "",
        delivery_time: data.gig.delivery_time?.toString() || "",
        city: data.gig.city || "",
        country: data.gig.country || "",
        gig_images: data.gig.gig_images || [],
      });
    })();
    setLoading(false);
  }, [gigId, getToken]);

  const handleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const filesArr = Array.from(e.target.files);
    const previews = filesArr.map(file => URL.createObjectURL(file));
    setPreviewImages(prev => [...prev, ...previews]);
    setImageUploading(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Unable to get authentication token");
        return;
      }
      const formData = new FormData();
      filesArr.forEach(file => {
        formData.append("files", file);
      });
      const res = await fetch("http://localhost:8800/api/cloudinary/upload-multiple", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setForm((prev: any) => ({
          ...prev,
          gig_images: [...prev.gig_images, ...data.files.map((f: any) => f.fileUrl)],
        }));
        setPreviewImages(prev => prev.slice(0, prev.length - previews.length));
        toast.success("Images uploaded successfully");
      } else {
        setPreviewImages(prev => prev.slice(0, prev.length - previews.length));
        toast.error(data.message || "Failed to upload images");
      }
    } catch (err) {
      toast.error("Failed to upload images");
      setPreviewImages(prev => prev.slice(0, prev.length - previews.length));
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = (idx: number) => {
    setForm((prev: any) => ({
      ...prev,
      gig_images: prev.gig_images.filter((_: any, i: number) => i !== idx),
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("[DEBUG] Save Changes clicked", form);
    e.preventDefault();
    if (!gigId) return;
    try {
      const token = await getToken();
      if (!token) { toast.error("Unable to get authentication token"); return; }
      const res = await fetch(`http://localhost:8800/api/gigs/${gigId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          starting_price: parseFloat(form.starting_price),
          delivery_time: parseInt(form.delivery_time),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Gig updated successfully");
        router.push("/my-gigs");
      } else {
        toast.error(data.message || "Update failed");
      }
    } catch (err) {
      toast.error("Failed to update gig");
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen">Loading...</div>;

  return (
    <div className="w-full max-w-6xl mx-auto py-10 px-4 md:px-8">
      <h1 className="text-3xl font-bold mb-6">Edit Your Gig</h1>
      <p className="text-base text-gray-500 mb-10">Update your service details and images. Make your gig stand out!</p>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col md:flex-row gap-12 md:gap-16">
          {/* Left: Info */}
          <div className="flex-1 min-w-0 space-y-7">
            <div className="space-y-2">
              <label className="text-base font-semibold">Title</label>
              <Input name="title" value={form.title} onChange={handleChange} required placeholder="e.g. I will design a modern logo" className="text-base" />
              <div className="text-xs text-gray-400">A catchy, clear title attracts more buyers.</div>
            </div>
            <div className="space-y-2">
              <label className="text-base font-semibold">Description</label>
              <Textarea name="description" value={form.description} onChange={handleChange} required rows={5} placeholder="Describe your gig in detail..." className="text-base" />
              <div className="text-xs text-gray-400">Explain what you offer and why you are the best choice.</div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-base font-semibold">Starting Price ($)</label>
                <Input name="starting_price" type="number" value={form.starting_price} onChange={handleChange} required min={1} placeholder="10" className="text-base" />
                <div className="text-xs text-gray-400">Set a competitive price for your service.</div>
              </div>
              <div className="space-y-2">
                <label className="text-base font-semibold">Delivery Time (days)</label>
                <Input name="delivery_time" type="number" value={form.delivery_time} onChange={handleChange} required min={1} placeholder="3" className="text-base" />
                <div className="text-xs text-gray-400">How many days to deliver?</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-base font-semibold">City</label>
                <Input name="city" value={form.city} onChange={handleChange} placeholder="e.g. Hanoi" className="text-base" />
              </div>
              <div className="space-y-2">
                <label className="text-base font-semibold">Country</label>
                <Input name="country" value={form.country} onChange={handleChange} placeholder="e.g. Vietnam" className="text-base" />
              </div>
            </div>
          </div>
          {/* Right: Images */}
          <div className="flex-1 min-w-[320px] max-w-lg mx-auto space-y-2">
            <label className="text-base font-semibold">Images</label>
            <div className="relative border-2 border-dashed border-emerald-200 rounded-xl p-4 flex flex-col items-center justify-center bg-white hover:border-emerald-400 transition-colors">
              <Upload className="w-10 h-10 text-emerald-400 mb-2" />
              <span className="text-gray-500 text-sm mb-2">Drag & drop or click to upload images (max 5)</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleImagesChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={imageUploading || form.gig_images.length >= 5}
                tabIndex={-1}
              />
              {imageUploading && <div className="absolute inset-0 bg-white/70 flex items-center justify-center text-emerald-600 text-base font-semibold animate-pulse z-10">Uploading...</div>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-4 justify-center">
              {form.gig_images.map((url: string, idx: number) => (
                <div key={"img-"+idx} className="relative group w-full aspect-[4/3] overflow-hidden">
                  <img src={url} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-2 right-2 bg-white bg-opacity-80 rounded-full p-1 text-red-500 hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                    title="Remove image"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
              {previewImages.map((url, idx) => (
                <div key={"preview-"+idx} className="relative group w-full aspect-[4/3] opacity-60 animate-pulse overflow-hidden">
                  <img src={url} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
            <div className="text-xs text-gray-400 mt-1 text-center">Upload high-quality images to attract more buyers.</div>
          </div>
        </div>
        {/* Nút ở dưới cùng, chiếm toàn bộ chiều ngang */}
        <div className="w-full flex justify-end gap-4 pt-8">
          <Button type="button" variant="outline" onClick={() => router.push("/my-gigs")} className="rounded-xl px-6">Cancel</Button>
          <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 rounded-xl px-6 text-base font-semibold shadow-lg">Save Changes</Button>
        </div>
      </form>
    </div>
  );
} 