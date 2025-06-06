"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Save, Upload, Bell, Lock, User, CreditCard, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import CertificationSection from "@/components/profile/CertificationSection"
import EducationSection from "@/components/profile/EducationSection"
import SkillsSection from "@/components/profile/SkillsSection"

export default function ProfileSettingsPage() {
  const [profileImage, setProfileImage] = useState("/placeholder.svg?height=120&width=120")
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [isSeller, setIsSeller] = useState(false)
  const clerkId = user?.clerk_id || ""

  useEffect(() => {
    // Lấy clerkId từ local/session hoặc auth context nếu có
    const storedClerkId = typeof window !== 'undefined' ? localStorage.getItem('clerk_id') : null;
    if (!storedClerkId) return;
    fetch(`http://localhost:8800/api/users/${storedClerkId}`)
      .then(res => res.json())
      .then(data => {
        setUser(data)
        setIsSeller(data?.user_roles?.includes("seller"))
      })
  }, [])

  const handleSave = () => {
    setSaving(true)
    // Simulate API call
    setTimeout(() => {
      setSaving(false)
    }, 1500)
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Account Settings</h1>
        <p className="text-gray-600">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="security" className="w-full">
        <TabsList className="mb-8 grid w-full grid-cols-3 md:w-auto">
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="account">
          {/* Account tab content removed as requested */}
        </TabsContent>

        <TabsContent value="security">
          <div className="grid gap-8 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Update your password to keep your account secure</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
                  {saving ? "Updating..." : "Update Password"}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium">Authenticator App</div>
                    <div className="text-sm text-gray-500">Use an authenticator app to generate one-time codes</div>
                  </div>
                  <Switch defaultChecked={false} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium">Text Message (SMS)</div>
                    <div className="text-sm text-gray-500">Receive a code via SMS to verify your identity</div>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-medium">Email</div>
                    <div className="text-sm text-gray-500">Receive a code via email to verify your identity</div>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
                  {saving ? "Saving..." : "Save Preferences"}
                </Button>
              </CardFooter>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Login Sessions</CardTitle>
                <CardDescription>Manage your active sessions and sign out from other devices</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Shield className="h-8 w-8 text-emerald-500" />
                        <div>
                          <div className="font-medium">Current Session</div>
                          <div className="text-sm text-gray-500">Windows 11 • Chrome • New York, USA</div>
                        </div>
                      </div>
                      <Badge>Active Now</Badge>
                    </div>
                  </div>
                  <div className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Shield className="h-8 w-8 text-gray-400" />
                        <div>
                          <div className="font-medium">Mobile App</div>
                          <div className="text-sm text-gray-500">iOS 16 • iPhone • New York, USA</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Sign Out
                      </Button>
                    </div>
                  </div>
                  <div className="rounded-md border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Shield className="h-8 w-8 text-gray-400" />
                        <div>
                          <div className="font-medium">MacBook Pro</div>
                          <div className="text-sm text-gray-500">macOS • Safari • New York, USA</div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Sign Out
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="outline" className="text-red-500 hover:bg-red-50 hover:text-red-600">
                  Sign Out From All Devices
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-4 text-lg font-medium">Email Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">Order Updates</div>
                      <div className="text-sm text-gray-500">Receive notifications about your orders</div>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">Messages</div>
                      <div className="text-sm text-gray-500">Receive notifications when someone messages you</div>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">Reviews</div>
                      <div className="text-sm text-gray-500">Receive notifications when someone leaves a review</div>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">Promotions</div>
                      <div className="text-sm text-gray-500">Receive notifications about promotions and offers</div>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">Push Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">Order Updates</div>
                      <div className="text-sm text-gray-500">Receive push notifications about your orders</div>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">Messages</div>
                      <div className="text-sm text-gray-500">Receive push notifications when someone messages you</div>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">Reviews</div>
                      <div className="text-sm text-gray-500">
                        Receive push notifications when someone leaves a review
                      </div>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-4 text-lg font-medium">SMS Notifications</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">Order Updates</div>
                      <div className="text-sm text-gray-500">Receive SMS notifications about your orders</div>
                    </div>
                    <Switch defaultChecked={false} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="font-medium">Security Alerts</div>
                      <div className="text-sm text-gray-500">Receive SMS notifications about security alerts</div>
                    </div>
                    <Switch defaultChecked={true} />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
                {saving ? "Saving..." : "Save Preferences"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
                <CardDescription>Manage your payment methods</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-16 items-center justify-center rounded-md bg-blue-100">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-blue-600"
                        >
                          <rect width="20" height="14" x="2" y="5" rx="2" />
                          <line x1="2" x2="22" y1="10" y2="10" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">Visa ending in 4242</div>
                        <div className="text-sm text-gray-500">Expires 12/2025</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>Default</Badge>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500">
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="rounded-md border p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-16 items-center justify-center rounded-md bg-red-100">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-red-600"
                        >
                          <rect width="20" height="14" x="2" y="5" rx="2" />
                          <line x1="2" x2="22" y1="10" y2="10" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-medium">Mastercard ending in 5678</div>
                        <div className="text-sm text-gray-500">Expires 08/2024</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        Set as Default
                      </Button>
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-500">
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="mt-4 w-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2"
                  >
                    <line x1="12" x2="12" y1="5" y2="19" />
                    <line x1="5" x2="19" y1="12" y2="12" />
                  </svg>
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>Manage your billing address</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="billingName">Full Name</Label>
                  <Input id="billingName" defaultValue="John Smith" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingAddress">Address</Label>
                  <Input id="billingAddress" defaultValue="123 Main St" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="billingCity">City</Label>
                    <Input id="billingCity" defaultValue="New York" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingState">State</Label>
                    <Input id="billingState" defaultValue="NY" />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="billingZip">ZIP Code</Label>
                    <Input id="billingZip" defaultValue="10001" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingCountry">Country</Label>
                    <Select defaultValue="us">
                      <SelectTrigger id="billingCountry">
                        <SelectValue placeholder="Select country" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us">United States</SelectItem>
                        <SelectItem value="ca">Canada</SelectItem>
                        <SelectItem value="uk">United Kingdom</SelectItem>
                        <SelectItem value="au">Australia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  )
}



