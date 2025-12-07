"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Search,
  Download,
  MoreHorizontal,
  Mail,
  Phone,
  AlertTriangle,
  RefreshCw,
  UserPlus,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"

const STAFF_ROLES = ["super_admin", "superadmin", "admin", "staff", "enumerator", "qa", "area_officer"]

interface User {
  id: string
  firebase_uid: string
  email: string
  first_name: string
  last_name: string
  middle_name?: string
  phone_number: string
  role: string
  is_active: boolean
  email_verified: boolean
  phone_verified: boolean
  created_at: string
  last_login: string
  property_count: number
}

interface FirebaseUser {
  uid: string
  email: string | null
  emailVerified: boolean
  displayName: string | null
  phoneNumber: string | null
  disabled: boolean
  creationTime: string
  lastSignInTime: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()

  // Supabase users state
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  // Firebase users state
  const [firebaseUsers, setFirebaseUsers] = useState<FirebaseUser[]>([])
  const [firebaseLoading, setFirebaseLoading] = useState(false)
  const [firebaseConfigured, setFirebaseConfigured] = useState(true)
  const [firebaseStats, setFirebaseStats] = useState({ total: 0, migrated: 0 })

  // Filters
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [activeTab, setActiveTab] = useState("all-users")

  // Selection
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  // Sheet/Dialog state
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false)
  const [newUserData, setNewUserData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    role: "staff",
  })
  const [addingUser, setAddingUser] = useState(false)

  // Migration state
  const [migratingUser, setMigratingUser] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
      } else if (userRole && !["admin", "super_admin", "superadmin", "staff"].includes(userRole)) {
        router.push("/dashboard")
      }
    }
  }, [user, userRole, authLoading, router])

  useEffect(() => {
    if (user && userRole && ["admin", "super_admin", "superadmin", "staff"].includes(userRole)) {
      fetchUsers()
    }
  }, [user, userRole])

  useEffect(() => {
    filterUsers()
  }, [searchQuery, roleFilter, statusFilter, users])

  async function fetchUsers() {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/users")
      const data = await response.json()

      if (data.error) {
        console.error("Error fetching users:", data.error)
        toast.error("Failed to load users")
        setUsers([])
      } else {
        const staffUsers = (data.users || []).filter((u: User) => STAFF_ROLES.includes(u.role))
        setUsers(staffUsers)
      }
    } catch (error) {
      console.error("Error in fetchUsers:", error)
      toast.error("Failed to load users")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchFirebaseUsers() {
    try {
      setFirebaseLoading(true)
      const response = await fetch("/api/admin/firebase-users")
      const data = await response.json()

      if (data.error && !data.firebaseConfigured) {
        setFirebaseConfigured(false)
        setFirebaseUsers([])
      } else if (data.error) {
        toast.error(data.error)
        setFirebaseUsers([])
      } else {
        setFirebaseConfigured(true)
        setFirebaseUsers(data.users || [])
        setFirebaseStats({
          total: data.totalFirebaseUsers || 0,
          migrated: data.totalMigrated || 0,
        })
      }
    } catch (error) {
      console.error("Error fetching Firebase users:", error)
      toast.error("Failed to load Firebase users")
      setFirebaseUsers([])
    } finally {
      setFirebaseLoading(false)
    }
  }

  function filterUsers() {
    let filtered = users

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (u) =>
          u.first_name?.toLowerCase().includes(query) ||
          u.last_name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.phone_number?.includes(query),
      )
    }

    if (roleFilter !== "all") {
      filtered = filtered.filter((u) => u.role === roleFilter)
    }

    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((u) => u.is_active)
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter((u) => !u.is_active)
      } else if (statusFilter === "verified") {
        filtered = filtered.filter((u) => u.email_verified)
      } else if (statusFilter === "unverified") {
        filtered = filtered.filter((u) => !u.email_verified)
      }
    }

    setFilteredUsers(filtered)
  }

  async function handleUpdateRole(userId: string, newRole: string) {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, updates: { role: newRole } }),
      })
      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success("Role updated successfully")
        fetchUsers()
      }
    } catch (error) {
      toast.error("Failed to update role")
    }
  }

  async function handleToggleStatus(userId: string, isActive: boolean) {
    try {
      const response = await fetch("/api/admin/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, updates: { is_active: !isActive } }),
      })
      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success(isActive ? "User deactivated" : "User activated")
        fetchUsers()
      }
    } catch (error) {
      toast.error("Failed to update user status")
    }
  }

  async function handleDeleteUser() {
    if (!userToDelete) return

    try {
      const response = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userToDelete.id }),
      })
      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success("User deactivated successfully")
        fetchUsers()
      }
    } catch (error) {
      toast.error("Failed to delete user")
    } finally {
      setIsDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  async function handleAddUser() {
    if (!newUserData.first_name || !newUserData.last_name || !newUserData.email) {
      toast.error("Please fill in all required fields")
      return
    }

    try {
      setAddingUser(true)
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUserData),
      })
      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success("User added successfully")
        setIsAddUserDialogOpen(false)
        setNewUserData({
          first_name: "",
          last_name: "",
          email: "",
          phone_number: "",
          role: "staff",
        })
        fetchUsers()
      }
    } catch (error) {
      toast.error("Failed to add user")
    } finally {
      setAddingUser(false)
    }
  }

  async function handleMigrateUser(firebaseUser: FirebaseUser, role = "staff") {
    try {
      setMigratingUser(firebaseUser.uid)
      const response = await fetch("/api/admin/firebase-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firebaseUser, role }),
      })
      const data = await response.json()

      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success("User migrated successfully")
        fetchUsers()
        fetchFirebaseUsers()
      }
    } catch (error) {
      toast.error("Failed to migrate user")
    } finally {
      setMigratingUser(null)
    }
  }

  function handleViewUser(user: User) {
    setSelectedUser(user)
    setIsDetailsSheetOpen(true)
  }

  function getRoleBadgeVariant(role: string) {
    switch (role) {
      case "super_admin":
      case "superadmin":
        return "destructive"
      case "admin":
        return "default"
      case "staff":
        return "secondary"
      case "enumerator":
        return "outline"
      case "area_officer":
        return "default"
      case "qa":
        return "secondary"
      default:
        return "outline"
    }
  }

  function formatDate(dateString: string) {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const stats = {
    total: users.length,
    active: users.filter((u) => u.is_active).length,
    inactive: users.filter((u) => !u.is_active).length,
    admins: users.filter((u) => ["admin", "super_admin", "superadmin"].includes(u.role)).length,
    enumerators: users.filter((u) => u.role === "enumerator").length,
    areaOfficers: users.filter((u) => u.role === "area_officer").length,
    qa: users.filter((u) => u.role === "qa").length,
  }

  if (authLoading || (!user && !authLoading)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col p-4 md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Staff Management</h1>
                <p className="text-sm text-muted-foreground">Manage staff users, roles, and permissions</p>
              </div>
              <Button onClick={() => setIsAddUserDialogOpen(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>

            {/* Stats Cards - Compact */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
              <Card className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Total Staff</p>
                    {loading ? (
                      <Skeleton className="h-5 w-12 mt-1" />
                    ) : (
                      <p className="text-lg font-bold">{stats.total}</p>
                    )}
                  </div>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
              <Card className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Active</p>
                    {loading ? (
                      <Skeleton className="h-5 w-12 mt-1" />
                    ) : (
                      <p className="text-lg font-bold text-green-600">{stats.active}</p>
                    )}
                  </div>
                  <UserCheck className="h-4 w-4 text-green-600" />
                </div>
              </Card>
              <Card className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Inactive</p>
                    {loading ? (
                      <Skeleton className="h-5 w-12 mt-1" />
                    ) : (
                      <p className="text-lg font-bold text-red-600">{stats.inactive}</p>
                    )}
                  </div>
                  <UserX className="h-4 w-4 text-red-600" />
                </div>
              </Card>
              <Card className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Admins</p>
                    {loading ? (
                      <Skeleton className="h-5 w-12 mt-1" />
                    ) : (
                      <p className="text-lg font-bold">{stats.admins}</p>
                    )}
                  </div>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
              <Card className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Enumerators</p>
                    {loading ? (
                      <Skeleton className="h-5 w-12 mt-1" />
                    ) : (
                      <p className="text-lg font-bold">{stats.enumerators}</p>
                    )}
                  </div>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
              <Card className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Area Officers</p>
                    {loading ? (
                      <Skeleton className="h-5 w-12 mt-1" />
                    ) : (
                      <p className="text-lg font-bold">{stats.areaOfficers}</p>
                    )}
                  </div>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
              <Card className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">QA</p>
                    {loading ? <Skeleton className="h-5 w-12 mt-1" /> : <p className="text-lg font-bold">{stats.qa}</p>}
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                </div>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value)
                if (value === "migration" && firebaseUsers.length === 0 && firebaseConfigured) {
                  fetchFirebaseUsers()
                }
              }}
            >
              <TabsList>
                <TabsTrigger value="all-users">All Staff</TabsTrigger>
                <TabsTrigger value="migration">
                  Migration
                  {firebaseUsers.length > 0 && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {firebaseUsers.length}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* All Users Tab */}
              <TabsContent value="all-users" className="mt-4">
                {/* Filters - Compact */}
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, email, phone..."
                      className="pl-9 h-9"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[150px] h-9">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="enumerator">Enumerator</SelectItem>
                      <SelectItem value="area_officer">Area Officer</SelectItem>
                      <SelectItem value="qa">QA</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[140px] h-9">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="unverified">Unverified</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="h-9 bg-transparent">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </div>

                {/* Users Table */}
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                              onCheckedChange={(checked) => {
                                setSelectedUsers(checked ? filteredUsers.map((u) => u.id) : [])
                              }}
                            />
                          </TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="w-20 text-center">Status</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {loading ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <TableRow key={i}>
                              <TableCell>
                                <Skeleton className="h-4 w-4" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-32" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-24" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-16" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-8 mx-auto" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-20" />
                              </TableCell>
                              <TableCell>
                                <Skeleton className="h-4 w-4" />
                              </TableCell>
                            </TableRow>
                          ))
                        ) : filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                              No staff members found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((u) => (
                            <TableRow
                              key={u.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => handleViewUser(u)}
                            >
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <Checkbox
                                  checked={selectedUsers.includes(u.id)}
                                  onCheckedChange={(checked) => {
                                    setSelectedUsers(
                                      checked ? [...selectedUsers, u.id] : selectedUsers.filter((id) => id !== u.id),
                                    )
                                  }}
                                />
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="font-medium">
                                    {u.first_name} {u.last_name}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    {u.email || "—"}
                                  </p>
                                  <p className="flex items-center gap-1 text-muted-foreground">
                                    <Phone className="h-3 w-3" />
                                    {u.phone_number || "—"}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getRoleBadgeVariant(u.role)}>{u.role?.replace("_", " ")}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center justify-center gap-2">
                                  <Tooltip>
                                    <TooltipTrigger>
                                      {u.is_active ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-red-600" />
                                      )}
                                    </TooltipTrigger>
                                    <TooltipContent>{u.is_active ? "Active" : "Inactive"}</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      {u.email_verified ? (
                                        <Mail className="h-4 w-4 text-blue-600" />
                                      ) : (
                                        <Clock className="h-4 w-4 text-yellow-600" />
                                      )}
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {u.email_verified ? "Email Verified" : "Email Unverified"}
                                    </TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(u.created_at)}</TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleViewUser(u)}>View Details</DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleToggleStatus(u.id, u.is_active)}>
                                      {u.is_active ? "Deactivate" : "Activate"}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => {
                                        setUserToDelete(u)
                                        setIsDeleteDialogOpen(true)
                                      }}
                                    >
                                      Delete User
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Migration Tab */}
              <TabsContent value="migration" className="mt-4">
                {!firebaseConfigured ? (
                  <Card className="p-8">
                    <div className="text-center">
                      <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Firebase Admin Not Configured</h3>
                      <p className="text-muted-foreground mb-4">
                        To view Firebase users for migration, you need to configure Firebase Admin credentials.
                      </p>
                      <p className="text-sm text-muted-foreground">Add the following environment variables:</p>
                      <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                        <li>
                          <code className="bg-muted px-1 rounded">FIREBASE_CLIENT_EMAIL</code>
                        </li>
                        <li>
                          <code className="bg-muted px-1 rounded">FIREBASE_PRIVATE_KEY</code>
                        </li>
                      </ul>
                    </div>
                  </Card>
                ) : (
                  <>
                    {/* Migration Stats */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <Card className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Firebase Users</p>
                            <p className="text-lg font-bold">{firebaseStats.total}</p>
                          </div>
                          <Users className="h-4 w-4 text-orange-500" />
                        </div>
                      </Card>
                      <Card className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Migrated</p>
                            <p className="text-lg font-bold text-green-600">{firebaseStats.migrated}</p>
                          </div>
                          <UserCheck className="h-4 w-4 text-green-600" />
                        </div>
                      </Card>
                      <Card className="py-3 px-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-muted-foreground">Pending</p>
                            <p className="text-lg font-bold text-yellow-600">{firebaseUsers.length}</p>
                          </div>
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        </div>
                      </Card>
                    </div>

                    {/* Refresh Button */}
                    <div className="flex justify-end mb-4">
                      <Button variant="outline" size="sm" onClick={fetchFirebaseUsers} disabled={firebaseLoading}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${firebaseLoading ? "animate-spin" : ""}`} />
                        Refresh
                      </Button>
                    </div>

                    {/* Firebase Users Table */}
                    <Card>
                      <CardContent className="p-0">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Email</TableHead>
                              <TableHead>Display Name</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Created</TableHead>
                              <TableHead>Last Sign In</TableHead>
                              <TableHead className="w-32">Migrate As</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {firebaseLoading ? (
                              Array.from({ length: 3 }).map((_, i) => (
                                <TableRow key={i}>
                                  <TableCell>
                                    <Skeleton className="h-4 w-32" />
                                  </TableCell>
                                  <TableCell>
                                    <Skeleton className="h-4 w-24" />
                                  </TableCell>
                                  <TableCell>
                                    <Skeleton className="h-4 w-20" />
                                  </TableCell>
                                  <TableCell>
                                    <Skeleton className="h-4 w-20" />
                                  </TableCell>
                                  <TableCell>
                                    <Skeleton className="h-4 w-20" />
                                  </TableCell>
                                  <TableCell>
                                    <Skeleton className="h-4 w-24" />
                                  </TableCell>
                                </TableRow>
                              ))
                            ) : firebaseUsers.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                  No pending migrations
                                </TableCell>
                              </TableRow>
                            ) : (
                              firebaseUsers.map((fu) => (
                                <TableRow key={fu.uid}>
                                  <TableCell>{fu.email || "—"}</TableCell>
                                  <TableCell>{fu.displayName || "—"}</TableCell>
                                  <TableCell>{fu.phoneNumber || "—"}</TableCell>
                                  <TableCell>{formatDate(fu.creationTime)}</TableCell>
                                  <TableCell>{formatDate(fu.lastSignInTime)}</TableCell>
                                  <TableCell>
                                    <Select
                                      defaultValue="staff"
                                      onValueChange={(role) => handleMigrateUser(fu, role)}
                                      disabled={migratingUser === fu.uid}
                                    >
                                      <SelectTrigger className="h-8 w-28">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="staff">Staff</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="enumerator">Enumerator</SelectItem>
                                        <SelectItem value="area_officer">Area Officer</SelectItem>
                                        <SelectItem value="qa">QA</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </SidebarInset>
      </SidebarProvider>

      {/* User Details Sheet */}
      <Sheet open={isDetailsSheetOpen} onOpenChange={setIsDetailsSheetOpen}>
        <SheetContent className="sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>User Details</SheetTitle>
            <SheetDescription>View and manage user information</SheetDescription>
          </SheetHeader>
          {selectedUser && (
            <div className="mt-6 space-y-6">
              <div className="space-y-4">
                <div>
                  <Label className="text-muted-foreground text-xs">Full Name</Label>
                  <p className="font-medium">
                    {selectedUser.first_name} {selectedUser.last_name}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Email</Label>
                  <p className="font-medium">{selectedUser.email || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Phone</Label>
                  <p className="font-medium">{selectedUser.phone_number || "—"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Role</Label>
                  <Select value={selectedUser.role} onValueChange={(value) => handleUpdateRole(selectedUser.id, value)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                      <SelectItem value="enumerator">Enumerator</SelectItem>
                      <SelectItem value="area_officer">Area Officer</SelectItem>
                      <SelectItem value="qa">QA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant={selectedUser.is_active ? "default" : "secondary"}>
                      {selectedUser.is_active ? "Active" : "Inactive"}
                    </Badge>
                    {selectedUser.email_verified && <Badge variant="outline">Email Verified</Badge>}
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Joined</Label>
                  <p className="font-medium">{formatDate(selectedUser.created_at)}</p>
                </div>
              </div>
              <div className="flex flex-col gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => handleToggleStatus(selectedUser.id, selectedUser.is_active)}>
                  {selectedUser.is_active ? "Deactivate User" : "Activate User"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setUserToDelete(selectedUser)
                    setIsDeleteDialogOpen(true)
                    setIsDetailsSheetOpen(false)
                  }}
                >
                  Delete User
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the user account for {userToDelete?.first_name} {userToDelete?.last_name}. The user
              will no longer be able to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isAddUserDialogOpen} onOpenChange={setIsAddUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Staff User</DialogTitle>
            <DialogDescription>
              Create a new staff account. They will receive an email to set their password.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  value={newUserData.first_name}
                  onChange={(e) => setNewUserData({ ...newUserData, first_name: e.target.value })}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  value={newUserData.last_name}
                  onChange={(e) => setNewUserData({ ...newUserData, last_name: e.target.value })}
                  placeholder="Doe"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                placeholder="john.doe@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={newUserData.phone_number}
                onChange={(e) => setNewUserData({ ...newUserData, phone_number: e.target.value })}
                placeholder="08012345678"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select
                value={newUserData.role}
                onValueChange={(value) => setNewUserData({ ...newUserData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="enumerator">Enumerator</SelectItem>
                  <SelectItem value="area_officer">Area Officer</SelectItem>
                  <SelectItem value="qa">QA</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddUserDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddUser} disabled={addingUser}>
              {addingUser ? "Adding..." : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  )
}
