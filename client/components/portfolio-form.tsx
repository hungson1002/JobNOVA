"use client";

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { useToast } from './ui/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from "@clerk/nextjs";
import { fetchUser } from '@/lib/api';

interface Category {
  id: number;
  name: string;
}

interface Gig {
  id: number;
  title: string;
  gig_image?: string;
  gig_skills?: string[];
}

interface PortfolioFormProps {
  categories: Category[];
  userGigs: Gig[];
  clerkId: string;
}

export function PortfolioForm({ categories, userGigs, clerkId }: PortfolioFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [gigId, setGigId] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { getToken } = useAuth();

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple: true,
    onDrop: async (acceptedFiles) => {
      setIsUploading(true);
      try {
        const formData = new FormData();
        acceptedFiles.forEach(file => {
          formData.append('files', file);
        });

        const response = await fetch('http://localhost:8800/api/cloudinary/upload-multiple', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();
        if (data.success) {
          setImages(prev => [...prev, ...data.files.map((f: any) => f.fileUrl)]);
          toast({
            title: 'Success',
            description: 'Images uploaded successfully',
          });
        } else {
          throw new Error(data.message || 'Upload failed');
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to upload images',
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || images.length === 0) {
      toast({
        title: 'Error',
        description: 'Title and at least one image are required',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getToken();
      const payload = {
        title,
        description,
        category_id: categoryId ? parseInt(categoryId) : null,
        gig_id: gigId ? parseInt(gigId) : null,
        portfolio_images: images,
      };
      console.log('[DEBUG] PortfolioForm submit payload:', payload);
      const response = await fetch('http://localhost:8800/api/portfolios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create portfolio');
      }

      toast({
        title: 'Success',
        description: 'Portfolio created successfully',
      });

      let username = null;
      if (token) {
        try {
          const userData = await fetchUser(clerkId ? String(clerkId) : '', token);
          username = userData.username;
        } catch (e) {
          // fallback nếu không lấy được username
        }
      }
      if (username) {
        router.push(`/users/${String(username)}`);
      } else {
        router.push(`/users/${String(clerkId)}`);
      }
      router.refresh();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save portfolio',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter project title"
          required
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your project"
          rows={4}
          disabled={isSubmitting}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Category</label>
        <Select value={categoryId} onValueChange={setCategoryId} disabled={isSubmitting}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Connect to Your Gig</label>
        <Select value={gigId} onValueChange={setGigId} disabled={isSubmitting}>
          <SelectTrigger>
            <SelectValue placeholder="Select a gig" />
          </SelectTrigger>
          <SelectContent>
            {userGigs.map((gig) => (
              <SelectItem key={gig.id} value={gig.id.toString()}>
                <div className="flex items-center gap-2">
                  {gig.gig_image && (
                    <img
                      src={gig.gig_image}
                      alt={gig.title}
                      className="w-6 h-6 object-cover rounded"
                    />
                  )}
                  <span>{gig.title}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Project Images</label>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-emerald-500 bg-emerald-50' : 'border-gray-300 hover:border-emerald-500'}
            ${isUploading || isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} type="file" disabled={isUploading || isSubmitting} />
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? 'Drop the files here...'
              : 'Drag & drop images here, or click to select files'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Max file size: 5MB. Supported formats: PNG, JPG, JPEG, GIF
          </p>
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative aspect-square group">
              <img
                src={image}
                alt={`Project image ${index + 1}`}
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isSubmitting}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isUploading || isSubmitting || !title || images.length === 0}
      >
        {isSubmitting ? 'Saving...' : isUploading ? 'Uploading...' : 'Save & Publish'}
      </Button>
    </form>
  );
} 