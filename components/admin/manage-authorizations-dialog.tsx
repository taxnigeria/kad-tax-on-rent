"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createBrowserClient } from "@/lib/supabase-client"
import { Search, X, UserCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  role: string
}

interface Authorization {
  id: string
  manager: User
  owner: User
  authorization_date: string
  is_active: boolean
  notes: string | null
}

interface ManageAuthorizationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManageAuthorizationsDialog({ open, onOpenChange }: ManageAuthorizationsDialogProps) {
  const [loading, setLoading] = useState(false)
  const [authorizations, setAuthorizations] = useState<Authorization[]>([])
  const [managers, setManagers] = useState<User[]>([])
  const [owners, setOwners] = useState<User[]>([])
  const [selectedManager, setSelectedManager] = useState<User | null>(null)
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null)
  const [notes, setNotes] = useState("")
  const [managerSearch, setManagerSearch] = useState("")
  const [ownerSearch, setOwnerSearch] = useState("")
  const [showManagerDropdown, setShowManagerDropdown] = useState(false)
  const [showOwnerDropdown, setShowOwnerDropdown] = useState(false)
  const supabase = createBrowserClient()

  useEffect(() => {
    if (open) {
      fetchAuthorizations()
      fetchManagers()
      fetchOwners()
    }
  }, [open])

  const fetchAuthorizations = async () => {
    try {
      const { data, error } = await supabase
        .from("manager_authorizations")
        .select(`
          id,
          authorization_date,
          is_active,
          notes,
          manager:manager_id (id, first_name, last_name, email, role),
          owner:owner_id (id, first_name, last_name, email, role)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error
      setAuthorizations(data as any)
    } catch (error) {
      console.error("Error fetching authorizations:", error)
    }
  }

  const fetchManagers = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, role")
        .eq("role", "property_manager")
        .eq("is_active", true)

      if (error) throw error
      setManagers(data || [])
    } catch (error) {
      console.error("Error fetching managers:", error)
    }
  }

  const fetchOwners = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, role")
        .eq("role", "taxpayer")
        .eq("is_active", true)

      if (error) throw error
      setOwners(data || [])
    } catch (error) {
      console.error("Error fetching owners:", error)
    }
  }

  const handleCreateAuthorization = async () => {
    if (!selectedManager || !selectedOwner) {
      toast.error("Please select both a manager and an owner.")
      return
    }

    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase.from("manager_authorizations").insert({
        manager_id: selectedManager.id,
        owner_id: selectedOwner.id,
        authorized_by: user?.id,
        notes: notes || null,
      })

      if (error) throw error

      toast.success(
        `${selectedManager.first_name} ${selectedManager.last_name} can now manage properties for ${selectedOwner.first_name} ${selectedOwner.last_name}.`,
      )

      // Reset form
      setSelectedManager(null)
      setSelectedOwner(null)
      setNotes("")
      setManagerSearch("")
      setOwnerSearch("")

      // Refresh list
      fetchAuthorizations()
    } catch (error: any) {
      toast.error(error.message || "Failed to create authorization.")
    } finally {
      setLoading(false)
    }
  }

  const handleToggleAuthorization = async (authId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("manager_authorizations")
        .update({ is_active: !currentStatus })
        .eq("id", authId)

      if (error) throw error

      toast.success(`The authorization has been ${currentStatus ? "deactivated" : "activated"}.`)

      fetchAuthorizations()
    } catch (error: any) {
      toast.error(error.message || "Failed to update authorization.")
    }
  }

  const filteredManagers = managers.filter((m) =>
    `${m.first_name} ${m.last_name} ${m.email}`.toLowerCase().includes(managerSearch.toLowerCase()),
  )

  const filteredOwners = owners.filter((o) =>
    `${o.first_name} ${o.last_name} ${o.email}`.toLowerCase().includes(ownerSearch.toLowerCase()),
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Manager Authorizations</DialogTitle>
          <DialogDescription>Authorize property managers to manage properties on behalf of owners.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Create New Authorization */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-sm">Create New Authorization</h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Manager Selection */}
              <div className="space-y-2">
                <Label>Property Manager</Label>
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search managers..."
                        value={managerSearch}
                        onChange={(e) => {
                          setManagerSearch(e.target.value)
                          setShowManagerDropdown(true)
                        }}
                        onFocus={() => setShowManagerDropdown(true)}
                        className="pl-9"
                      />
                    </div>
                    {selectedManager && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedManager(null)
                          setManagerSearch("")
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {showManagerDropdown && managerSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredManagers.length > 0 ? (
                        filteredManagers.map((manager) => (
                          <button
                            key={manager.id}
                            className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                            onClick={() => {
                              setSelectedManager(manager)
                              setManagerSearch(`${manager.first_name} ${manager.last_name}`)
                              setShowManagerDropdown(false)
                            }}
                          >
                            <div className="font-medium">
                              {manager.first_name} {manager.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">{manager.email}</div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No managers found</div>
                      )}
                    </div>
                  )}
                </div>
                {selectedManager && (
                  <div className="text-xs text-muted-foreground">
                    Selected: {selectedManager.first_name} {selectedManager.last_name}
                  </div>
                )}
              </div>

              {/* Owner Selection */}
              <div className="space-y-2">
                <Label>Property Owner</Label>
                <div className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search owners..."
                        value={ownerSearch}
                        onChange={(e) => {
                          setOwnerSearch(e.target.value)
                          setShowOwnerDropdown(true)
                        }}
                        onFocus={() => setShowOwnerDropdown(true)}
                        className="pl-9"
                      />
                    </div>
                    {selectedOwner && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedOwner(null)
                          setOwnerSearch("")
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {showOwnerDropdown && ownerSearch && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                      {filteredOwners.length > 0 ? (
                        filteredOwners.map((owner) => (
                          <button
                            key={owner.id}
                            className="w-full text-left px-3 py-2 hover:bg-accent text-sm"
                            onClick={() => {
                              setSelectedOwner(owner)
                              setOwnerSearch(`${owner.first_name} ${owner.last_name}`)
                              setShowOwnerDropdown(false)
                            }}
                          >
                            <div className="font-medium">
                              {owner.first_name} {owner.last_name}
                            </div>
                            <div className="text-xs text-muted-foreground">{owner.email}</div>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-muted-foreground">No owners found</div>
                      )}
                    </div>
                  )}
                </div>
                {selectedOwner && (
                  <div className="text-xs text-muted-foreground">
                    Selected: {selectedOwner.first_name} {selectedOwner.last_name}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes (Optional)</Label>
              <Textarea
                placeholder="Add any notes about this authorization..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
              />
            </div>

            <Button
              onClick={handleCreateAuthorization}
              disabled={loading || !selectedManager || !selectedOwner}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <UserCheck className="mr-2 h-4 w-4" />
                  Create Authorization
                </>
              )}
            </Button>
          </div>

          {/* Existing Authorizations */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm">Existing Authorizations</h3>
            <div className="space-y-2">
              {authorizations.length > 0 ? (
                authorizations.map((auth) => (
                  <div key={auth.id} className="border rounded-lg p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {auth.manager.first_name} {auth.manager.last_name}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium text-sm">
                          {auth.owner.first_name} {auth.owner.last_name}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            auth.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {auth.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {auth.manager.email} → {auth.owner.email}
                      </div>
                      {auth.notes && <div className="text-xs text-muted-foreground mt-1">Note: {auth.notes}</div>}
                    </div>
                    <Button
                      variant={auth.is_active ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleToggleAuthorization(auth.id, auth.is_active)}
                    >
                      {auth.is_active ? "Deactivate" : "Activate"}
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No authorizations found. Create one above.
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
