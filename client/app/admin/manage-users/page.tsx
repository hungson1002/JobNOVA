"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, Filter, MoreHorizontal, Shield, User, Star, CheckCircle, Eye, Trash2, Ban, CheckCircle2, X } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface User {
  id: number;
  clerk_id: string;
  user_roles: string[];
  country: string;
  description: string | null;
  registration_date: string;
  date_of_birth: string | null;
  gender: number;
  contact_number: string | null;
  is_banned: boolean;
  username: string | null;
  firstname: string | null;
  lastname: string | null;
  avatar: string | null;
  languages: string[] | null;
  location: string | null;
  plan_to_use: object | null;
  checklist_status: object | null;
  preferred_days: string[] | null;
  preferred_hours: string[] | null;
  timezone: string | null;
}

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState("all")
  const { toast } = useToast()

  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("http://localhost:8800/api/users")
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDelete = async (userId: number) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      const response = await fetch(`http://localhost:8800/api/users/${userId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Success",
          description: "User deleted successfully",
        })
        fetchUsers() // Refresh the list
      } else {
        throw new Error("Failed to delete user")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete user",
        variant: "destructive",
      })
    }
  }

  const handleViewDetails = async (userId: number) => {
    try {
      // Tìm user theo id trong danh sách users để lấy clerk_id
      const userInList = users.find(u => u.id === userId);
      if (!userInList) throw new Error("User not found in list");
      const response = await fetch(`http://localhost:8800/api/users/${userInList.clerk_id}`)
      const user = await response.json()
      setSelectedUser(user)
      setIsViewDialogOpen(true)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch user details",
        variant: "destructive",
      })
    }
  }

  const handleBanUser = async (clerkId: string) => {
    try {
      const response = await fetch(`http://localhost:8800/api/users/${clerkId}/ban`, {
        method: "PATCH",
      });
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success",
          description: data.message,
        });
        fetchUsers(); // Refresh lại danh sách
      } else {
        throw new Error("Failed to update user status");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    }
  };

  const getGenderText = (gender: number) => {
    switch (gender) {
      case 1:
        return "Male"
      case 2:
        return "Female"
      default:
        return "Other"
    }
  }

  // Filter users based on search, role and status
  const filteredUsers = users.filter((user) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = user.clerk_id.toLowerCase().includes(searchLower) ||
      user.country.toLowerCase().includes(searchLower) ||
      (user.username?.toLowerCase().includes(searchLower) || false);
    const matchesRole = roleFilter === "all" || user.user_roles.includes(roleFilter);
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && !user.is_banned) ||
      (statusFilter === "banned" && user.is_banned);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / pageSize)
  const paginatedUsers = filteredUsers.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="container max-w-6xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-4xl font-extrabold text-emerald-700 tracking-tight mb-2">User Management</h1>
        <p className="text-lg text-gray-500">View, search, and manage all users on the platform</p>
      </div>
      {/* Search & Filter Bar */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/80 rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by ID, username or country..."
            className="pl-9 pr-4 h-10 bg-white rounded-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[130px] h-10 bg-white rounded-lg">
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="employer">Employers</SelectItem>
              <SelectItem value="seeker">Seekers</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-10 bg-white rounded-lg">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
          <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
            <SelectTrigger className="w-[130px] h-10 bg-white rounded-lg">
              <SelectValue placeholder="10 per page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 per page</SelectItem>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Data Table */}
      <Card className="rounded-3xl border-2 border-gray-100 shadow-xl hover:shadow-2xl transition-shadow duration-300">
        <CardContent className="p-0">
          <div className="p-6">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-full rounded-2xl overflow-hidden shadow-md">
                  <TableHeader>
                    <TableRow className="bg-emerald-50 dark:bg-emerald-900">
                      <TableHead className="py-4 px-6 text-lg font-bold text-gray-700 dark:text-gray-200 w-[180px]">User ID</TableHead>
                      <TableHead className="py-4 px-6 text-lg font-bold text-gray-700 dark:text-gray-200 w-[150px]">Username</TableHead>
                      <TableHead className="py-4 px-6 text-lg font-bold text-gray-700 dark:text-gray-200 w-[200px]">Roles</TableHead>
                      <TableHead className="py-4 px-6 text-lg font-bold text-gray-700 dark:text-gray-200">Country</TableHead>
                      <TableHead className="py-4 px-6 text-lg font-bold text-gray-700 dark:text-gray-200 w-[150px]">Registration Date</TableHead>
                      <TableHead className="py-4 px-6 text-lg font-bold text-gray-700 dark:text-gray-200 w-[100px]">Status</TableHead>
                      <TableHead className="py-4 px-6 text-lg font-bold text-gray-700 dark:text-gray-200 w-[100px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      Array.from({ length: pageSize }).map((_, idx) => (
                        <TableRow key={idx} className="hover:bg-muted/50">
                          <TableCell><div className="h-5 w-32 animate-pulse rounded bg-muted"></div></TableCell>
                          <TableCell><div className="h-5 w-24 animate-pulse rounded bg-muted"></div></TableCell>
                          <TableCell><div className="h-5 w-32 animate-pulse rounded bg-muted"></div></TableCell>
                          <TableCell><div className="h-5 w-24 animate-pulse rounded bg-muted"></div></TableCell>
                          <TableCell><div className="h-5 w-28 animate-pulse rounded bg-muted"></div></TableCell>
                          <TableCell><div className="h-5 w-16 animate-pulse rounded bg-muted"></div></TableCell>
                          <TableCell><div className="flex justify-end"><div className="h-8 w-8 animate-pulse rounded bg-muted"></div></div></TableCell>
                        </TableRow>
                      ))
                    ) : paginatedUsers.length > 0 ? (
                      paginatedUsers.map((user) => (
                        <TableRow key={user.id} className="hover:bg-emerald-50 transition-all">
                          <TableCell className="py-3 px-6 font-medium">{user.clerk_id}</TableCell>
                          <TableCell className="py-3 px-6">
                            <span className="font-medium text-emerald-600">{user.username || "N/A"}</span>
                          </TableCell>
                          <TableCell className="py-3 px-6">
                            <div className="flex flex-wrap gap-1 items-center">
                              {user.user_roles.map((role) => (
                                <Badge
                                  key={role}
                                  className={
                                    role === "admin"
                                      ? "bg-emerald-600 text-white px-2 py-0.5"
                                      : role === "employer"
                                      ? "bg-blue-100 text-blue-700 px-2 py-0.5"
                                      : "bg-gray-200 text-gray-700 px-2 py-0.5"
                                  }
                                >
                                  {role === "admin"
                                    ? "Admin"
                                    : role === "employer"
                                    ? "Employer"
                                    : "Seeker"}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="py-3 px-6">{user.country}</TableCell>
                          <TableCell className="py-3 px-6">{new Date(user.registration_date).toLocaleDateString()}</TableCell>
                          <TableCell className="py-3 px-6">
                            {user.is_banned ? (
                              <Badge className="bg-red-100 text-red-700 px-2 py-0.5">Banned</Badge>
                            ) : (
                              <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-0.5">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-3 px-6 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted rounded-full">
                                  <span className="sr-only">Open menu</span>
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[180px] rounded-xl">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleViewDetails(user.id)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className={user.is_banned ? "text-emerald-600" : "text-red-600"}
                                  onClick={() => handleBanUser(user.clerk_id)}
                                >
                                  {user.is_banned ? (
                                    <>
                                      <CheckCircle2 className="mr-2 h-4 w-4" />
                                      Unban User
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="mr-2 h-4 w-4" />
                                      Ban User
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => handleDelete(user.id)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete User
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="h-32 text-center py-8 text-gray-400 text-lg">
                          <div className="flex flex-col items-center justify-center">
                            <User className="h-8 w-8 mb-2" />
                            <p>No users found</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
            {/* Pagination */}
            {!isLoading && filteredUsers.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="text-sm text-center text-muted-foreground">
                  Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, filteredUsers.length)} of {filteredUsers.length} users
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="h-8 w-24"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                      <Button
                        key={pageNumber}
                        variant={pageNumber === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNumber)}
                        className="h-8 w-8"
                      >
                        {pageNumber}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                    className="h-8 w-24"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl rounded-2xl border-2 border-emerald-100">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-emerald-700">
              User Details
            </DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="flex flex-col md:flex-row gap-8 mt-2">
              {/* Profile Card */}
              <div className="md:w-1/3 w-full bg-gray-50 rounded-2xl border p-6 flex flex-col items-center shadow-sm">
                {selectedUser.avatar ? (
                  <img src={selectedUser.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border mb-3" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-4xl text-gray-400 font-bold mb-3">
                    {selectedUser.firstname?.[0] || selectedUser.username?.[0] || "U"}
                  </div>
                )}
                <div className="font-bold text-2xl text-center">{selectedUser.firstname || ""} {selectedUser.lastname || ""}</div>
                <div className="text-gray-500 text-center">@{selectedUser.username || selectedUser.clerk_id}</div>
                <div className="text-xs text-gray-400 text-center mb-2">User ID: {selectedUser.id}</div>
                <div className="flex flex-wrap gap-2 justify-center mt-2 mb-2">
                  {(Array.isArray(selectedUser.user_roles) ? selectedUser.user_roles : []).map((role) => (
                    <Badge key={role} className={
                      role === "admin"
                        ? "bg-emerald-600 text-white px-2 py-0.5"
                        : role === "employer"
                        ? "bg-blue-100 text-blue-700 px-2 py-0.5"
                        : "bg-gray-200 text-gray-700 px-2 py-0.5"
                    }>
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </Badge>
                  ))}
                </div>
                <div className="mt-2">
                  {selectedUser.is_banned ? (
                    <Badge className="bg-red-100 text-red-700 px-2 py-0.5">Banned</Badge>
                  ) : (
                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-0.5">Active</Badge>
                  )}
                </div>
                <div className="mt-4 text-sm text-gray-500 text-center">
                  <div><span className="font-semibold">Registered:</span> {new Date(selectedUser.registration_date).toLocaleDateString()}</div>
                </div>
              </div>
              {/* Detail Info */}
              <div className="md:w-2/3 w-full grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Clerk ID</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="mt-1 text-base cursor-pointer max-w-[180px] truncate" style={{maxWidth:'180px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                          {selectedUser.clerk_id.length > 18 ? selectedUser.clerk_id.slice(0, 8) + '...' + selectedUser.clerk_id.slice(-6) : selectedUser.clerk_id}
                        </p>
                      </TooltipTrigger>
                      {selectedUser.clerk_id.length > 18 && (
                        <TooltipContent>
                          <span className="break-all">{selectedUser.clerk_id}</span>
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Country</h3>
                  <p className="mt-1 text-base">{selectedUser.country}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Location</h3>
                  <p className="mt-1 text-base">{selectedUser.location || <span className='text-gray-400 italic'>Not provided</span>}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Contact Number</h3>
                  <p className="mt-1 text-base">{selectedUser.contact_number || <span className='text-gray-400 italic'>Not provided</span>}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Gender</h3>
                  <p className="mt-1 text-base">{getGenderText(selectedUser.gender)}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Date of Birth</h3>
                  <p className="mt-1 text-base">{selectedUser.date_of_birth ? new Date(selectedUser.date_of_birth).toLocaleDateString() : <span className='text-gray-400 italic'>Not provided</span>}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Languages</h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedUser.languages && Array.isArray(selectedUser.languages) && selectedUser.languages.length > 0 ? (
                      selectedUser.languages.map((lang: string) => (
                        <Badge key={lang} className="bg-gray-100 text-gray-700 px-2 py-0.5">{lang}</Badge>
                      ))
                    ) : (
                      <span className='text-gray-400 italic'>Not provided</span>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Timezone</h3>
                  <p className="mt-1 text-base">{selectedUser.timezone || <span className='text-gray-400 italic'>Not provided</span>}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Preferred Days</h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedUser.preferred_days && Array.isArray(selectedUser.preferred_days) && selectedUser.preferred_days.length > 0 ? (
                      selectedUser.preferred_days.map((day: string) => (
                        <Badge key={day} className="bg-gray-100 text-gray-700 px-2 py-0.5">{day}</Badge>
                      ))
                    ) : (
                      <span className='text-gray-400 italic'>Not provided</span>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-gray-500">Preferred Hours</h3>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedUser.preferred_hours && Array.isArray(selectedUser.preferred_hours) && selectedUser.preferred_hours.length > 0 ? (
                      selectedUser.preferred_hours.map((hour: string) => (
                        <Badge key={hour} className="bg-gray-100 text-gray-700 px-2 py-0.5">{hour}</Badge>
                      ))
                    ) : (
                      <span className='text-gray-400 italic'>Not provided</span>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-gray-500">Plan to Use</h3>
                  <p className="mt-1 text-base">{selectedUser.plan_to_use ? JSON.stringify(selectedUser.plan_to_use) : <span className='text-gray-400 italic'>Not provided</span>}</p>
                </div>
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-gray-500">Checklist Status</h3>
                  <p className="mt-1 text-base">{selectedUser.checklist_status ? JSON.stringify(selectedUser.checklist_status) : <span className='text-gray-400 italic'>Not provided</span>}</p>
                </div>
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-sm text-gray-500">Description</h3>
                  <p className="mt-1 text-base">{selectedUser.description || <span className='text-gray-400 italic'>No description</span>}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
