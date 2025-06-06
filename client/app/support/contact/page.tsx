'use client';
import React from 'react';
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Mail, Phone, MapPin, Clock } from "lucide-react"

export default function ContactPage() {
  const contactInfo = [
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Email",
      details: [
        "General Support: support@jobnova.com",
        "Technical Support: tech@jobnova.com",
        "Partnership: partners@jobnova.com"
      ]
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: "Phone",
      details: [
        "Support: +84 123 456 789",
        "Business: +84 123 456 788",
        "Emergency: +84 123 456 787"
      ]
    },
    {
      icon: <MapPin className="h-6 w-6" />,
      title: "Address",
      details: [
        "Head Office: 15th Floor, Capital Place Building",
        "109 Tran Hung Dao, Hoan Kiem",
        "Hanoi, Vietnam"
      ]
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: "Working Hours",
      details: [
        "Monday - Friday: 8:00 AM - 6:00 PM",
        "Saturday: 9:00 AM - 3:00 PM",
        "Sunday: Closed"
      ]
    }
  ];

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="mb-16 text-center">
        <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
          We're here to help. Let us know what you need.
        </p>
      </section>

      {/* Contact Info Section */}
      <section className="mb-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {contactInfo.map((info, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 text-primary">{info.icon}</div>
                  <h3 className="text-xl font-bold mb-4">{info.title}</h3>
                  <div className="space-y-2">
                    {info.details.map((detail, idx) => (
                      <p key={idx} className="text-muted-foreground">{detail}</p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="mb-16">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-3xl font-bold mb-4">Send us a Message</h2>
            <p className="text-lg mb-6">
              Fill out the form below and we'll get back to you as soon as possible.
            </p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name*</label>
                  <Input placeholder="Your last name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">First Name*</label>
                  <Input placeholder="Your first name" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email*</label>
                <Input placeholder="email@example.com" type="email" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <Input placeholder="Your phone number" type="tel" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject*</label>
                <select className="w-full h-10 px-3 rounded-md border border-input bg-background" required>
                  <option value="">Select a subject</option>
                  <option>Technical Support</option>
                  <option>Account Support</option>
                  <option>Business Partnership</option>
                  <option>Report an Issue</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Message*</label>
                <textarea
                  className="w-full min-h-[150px] p-3 rounded-md border border-input bg-background resize-y"
                  placeholder="Please describe your issue in detail"
                  required
                ></textarea>
              </div>
              <Button className="w-full">Send Message</Button>
            </div>
          </div>
          <div className="bg-muted rounded-xl p-8">
            <h3 className="text-2xl font-bold mb-6">Additional Information</h3>
            <div className="space-y-6">
              <div>
                <h4 className="font-bold mb-2">Customer Support</h4>
                <p className="text-muted-foreground">
                  Our support team is ready to help you with any account, transaction, or service-related issues.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-2">Response Time</h4>
                <p className="text-muted-foreground">
                  We commit to responding within 24 business hours. Emergency issues will be handled immediately.
                </p>
              </div>
              <div>
                <h4 className="font-bold mb-2">Other Support Channels</h4>
                <ul className="space-y-2">
                  <li>
                    <Link href="/support/help-center" className="text-primary hover:underline">
                      Help Center
                    </Link>
                  </li>
                  <li>
                    <Link href="/support/trust-safety" className="text-primary hover:underline">
                      Trust & Safety
                    </Link>
                  </li>
                  <li>
                    <Link href="/community" className="text-primary hover:underline">
                      Community
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="mb-8 sm:mb-16">
        <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">Frequently Asked Questions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {[
            {
              question: "How can I contact customer support?",
              answer: "You can reach us via email, phone, or by filling out the contact form on this page."
            },
            {
              question: "What is the response time?",
              answer: "We commit to responding within 24 business hours. Emergency issues will be handled immediately."
            },
            {
              question: "Can I contact you outside business hours?",
              answer: "Yes, you can send an email or leave a message. We'll respond as soon as we return to work."
            },
            {
              question: "How do I report an emergency issue?",
              answer: "For emergency issues, please call our emergency phone number or use the contact form with the subject 'Emergency Report'."
            }
          ].map((faq, index) => (
            <Card key={index}>
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-bold mb-2">{faq.question}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{faq.answer}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Map Section */}
      <section className="mb-8 sm:mb-16">
        <div className="bg-muted rounded-xl p-4 sm:p-8">
          <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-center">Our Location</h2>
          <div className="aspect-video w-full bg-muted-foreground/20 rounded-lg">
            {/* Add Google Maps or interactive map here */}
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Map will be displayed here
            </div>
          </div>
        </div>
      </section>
    </div>
  );
} 