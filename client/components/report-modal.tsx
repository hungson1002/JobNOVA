"use client"

import type React from "react"

import { useState } from "react"
import { Flag, X } from "lucide-react"
import { useAuth } from "@clerk/nextjs"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface ReportModalProps {
  type: "user" | "service" | "order"
  id: string
  name: string
  trigger?: React.ReactNode
  ownerId?: string
  currentUserId?: string 
}

export function ReportModal({ type, id, name, trigger, ownerId, currentUserId }: ReportModalProps) {
  const [reason, setReason] = useState("")
  const [description, setDescription] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const { getToken } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const token = await getToken()
      if (!token) {
        throw new Error("Please sign in to submit a report")
      }

      const response = await fetch("http://localhost:8800/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        credentials: "include",
        body: JSON.stringify({
          target_type: type,
          target_id: id,
          reason,
          description,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || "Failed to submit report")
      }

      // Reset form và đóng modal
      setReason("")
      setDescription("")
      setIsSubmitting(false)
      setIsOpen(false)

      // Show success toast
      toast.success("Report Submitted", {
        description: "Your report has been submitted. Our team will review it shortly."
      })
    } catch (error) {
      console.error("Error submitting report:", error)
      toast.error("Error", {
        description: error instanceof Error ? error.message : "Failed to submit report. Please try again."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getReasonOptions = () => {
    switch (type) {
      case "user":
        return [
          { value: "fake-profile", label: "Fake Profile" },
          { value: "inappropriate-behavior", label: "Inappropriate Behavior" },
          { value: "spam", label: "Spam or Scam" },
          { value: "impersonation", label: "Impersonation" },
          { value: "other", label: "Other" },
        ]
      case "service":
        return [
          { value: "misleading", label: "Misleading Description" },
          { value: "copyright", label: "Copyright Infringement" },
          { value: "inappropriate-content", label: "Inappropriate Content" },
          { value: "prohibited-service", label: "Prohibited Service" },
          { value: "other", label: "Other" },
        ]
      case "order":
        return [
          { value: "not-as-described", label: "Service Not As Described" },
          { value: "poor-quality", label: "Poor Quality Delivery" },
          { value: "late-delivery", label: "Extremely Late Delivery" },
          { value: "no-communication", label: "No Communication" },
          { value: "other", label: "Other" },
        ]
      default:
        return [{ value: "other", label: "Other" }]
    }
  }

  const getTitle = () => {
    switch (type) {
      case "user":
        return `Report User: ${name}`
      case "service":
        return `Report Service: ${name}`
      case "order":
        return `Report Order #${id}`
      default:
        return "Report Issue"
    }
  }

  const getDescription = () => {
    switch (type) {
      case "user":
        return "Please provide details about why you're reporting this user. Our team will review your report and take appropriate action."
      case "service":
        return "Please provide details about why you're reporting this service. Our team will review your report and take appropriate action."
      case "order":
        return "Please provide details about the issue with your order. Our support team will review your report and help resolve the problem."
      default:
        return "Please provide details about the issue. Our team will review your report and take appropriate action."
    }
  }
  if (type === "service" && currentUserId === ownerId) {
    return (
      <div className="text-sm text-muted-foreground italic px-4 py-2 border border-gray-200 rounded-md bg-gray-50">
        Bạn không thể báo cáo gig của chính mình.
      </div>
    )
  }
  

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Flag className="mr-2 h-4 w-4" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for reporting</Label>
              <Select value={reason} onValueChange={setReason} required>
                <SelectTrigger id="reason">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {getReasonOptions().map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Please provide details about the issue..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[120px]"
                required
              />
              <p className="text-xs text-gray-500">
                Please be specific and include any relevant details that will help our team investigate.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
              className="mr-2"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-emerald-500 hover:bg-emerald-600">
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
