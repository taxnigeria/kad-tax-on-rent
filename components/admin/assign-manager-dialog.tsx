"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Search, UserCog, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/utils/supabase/client"
import { Card, CardContent } from "@/components/ui/card"

type AssignManagerDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  property: any
  onSuccess: () => void
}

function AssignManagerDialog({ open, onOpenChange, property, onSuccess }: AssignManagerDialogProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [managers, setManagers] = useState<any[]>([])
  const [selectedManager, setSelectedManager] = useState<any>(null)
  const [managementStartDate, setManagementStartDate] = useState(new Date().toISOString().split("T")[0])
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    if (open && property) {
      searchManagers("")
    }
  }, [open, property])

  async function searchManagers(query: string) {
    if (!property?.owner_id) return

    setSearching(true)
    try {
      // Get managers authorized for this property's owner
      const { data: authorizations, error: authError } = await supabase
        .from("manager_authorizations")
        .select(
          `
          manager_id,
          users!manager_authorizations_manager_id_fkey (
            id,
            first_name,
            middle_name,
            last_name,
            email,
            phone_number
          )
        `,
        )
        .eq("owner_id", property.owner_id)
        .eq("is_active", true)

      if (authError) throw authError

      let results = authorizations?.map((auth: any) => auth.users) || []

      // Filter by search query if provided
      if (query && query.length >= 2) {
        const lowerQuery = query.toLowerCase()
        results = results.filter(
          (manager: any) =>
            manager.first_name?.toLowerCase().includes(lowerQuery) ||
            manager.last_name?.toLowerCase().includes(lowerQuery) ||
            manager.email?.toLowerCase().includes(lowerQuery),
        )
      }

      setManagers(results)
    } catch (error) {
      console.error("Error searching managers:", error)
      toast({
        title: "Error",
        description: "Failed to search managers",
        variant: "destructive",
      })
    } finally {
      setSearching(false)
    }
  }

  async function handleAssignManager() {
    if (!property || !selectedManager) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from("properties")
        .update({
          property_manager_id: selectedManager.id,
          has_property_manager: true,
          management_start_date: managementStartDate,
          manager_full_name:
            `${selectedManager.first_name} ${selectedManager.middle_name || ""} ${selectedManager.last_name}`.trim(),
          manager_email: selectedManager.email,
          manager_phone: selectedManager.phone_number,
          updated_at: new Date().toISOString(),
        })
        .eq("id", property.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Property manager assigned successfully",
      })

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error assigning manager:", error)
      toast({
        title: "Error",
        description: "Failed to assign manager",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveManager() {
    if (!property) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from("properties")
        .update({
          property_manager_id: null,
          has_property_manager: false,
          management_start_date: null,
          manager_full_name: null,
          manager_email: null,
          manager_phone: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", property.id)

      if (error) throw error

      toast({
        title: "Success",
        description: "Property manager removed successfully",
      })

      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Error removing manager:", error)
      toast({
        title: "Error",
        description: "Failed to remove manager",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {property?.has_property_manager ? "Change Property Manager" : "Assign Property Manager"}
          </DialogTitle>
          <DialogDescription>
            Select a manager authorized to manage properties for this owner. Only authorized managers are shown.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Manager */}
          {property?.has_property_manager && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Current Manager</Label>
                <Button size="sm" variant="ghost" className="h-8 text-destructive" onClick={handleRemoveManager}>
                  <X className="h-4 w-4 mr-1" />
                  Remove Manager
                </Button>
              </div>
              <div className="p-3 border rounded-lg bg-muted/50">
                <div className="font-medium">{property.manager_full_name}</div>
                <div className="text-sm text-muted-foreground">{property.manager_email}</div>
                {property.manager_phone && (
                  <div className="text-sm text-muted-foreground">{property.manager_phone}</div>
                )}
              </div>
            </div>
          )}

          {/* Search Managers */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Authorized Managers</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  searchManagers(e.target.value)
                }}
                className="pl-9"
              />
            </div>
            {searching && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching...
              </div>
            )}
          </div>

          {/* Manager Results */}
          {managers.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg">
              {managers.map((manager) => (
                <button
                  key={manager.id}
                  className={`w-full p-3 text-left hover:bg-muted/50 transition-colors border-b last:border-b-0 ${
                    selectedManager?.id === manager.id ? "bg-primary/10" : ""
                  }`}
                  onClick={() => setSelectedManager(manager)}
                >
                  <div className="font-medium">
                    {manager.first_name} {manager.middle_name} {manager.last_name}
                  </div>
                  <div className="text-sm text-muted-foreground">{manager.email}</div>
                  {manager.phone_number && <div className="text-sm text-muted-foreground">{manager.phone_number}</div>}
                </button>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <UserCog className="h-12 w-12 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  No authorized managers found for this owner.
                  <br />
                  Please create a manager authorization first.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Selected Manager */}
          {selectedManager && (
            <div className="space-y-2">
              <Label>Selected Manager</Label>
              <div className="p-3 border rounded-lg bg-primary/5">
                <div className="font-medium">
                  {selectedManager.first_name} {selectedManager.middle_name} {selectedManager.last_name}
                </div>
                <div className="text-sm text-muted-foreground">{selectedManager.email}</div>
              </div>
            </div>
          )}

          {/* Management Start Date */}
          {selectedManager && (
            <div className="space-y-2">
              <Label htmlFor="startDate">Management Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={managementStartDate}
                onChange={(e) => setManagementStartDate(e.target.value)}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAssignManager} disabled={!selectedManager || loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Assigning...
              </>
            ) : (
              "Assign Manager"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default AssignManagerDialog
