"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getAvailablePropertyManagers, authorizePropertyManager } from "@/app/actions/manager-authorizations"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Loader2, Search } from "lucide-react"
import { useMemo } from "react"

interface AuthorizeManagerModalProps {
  isOpen: boolean
  onClose: () => void
  onAuthorizeSuccess: () => void
}

interface Manager {
  id: string
  first_name: string
  last_name: string
  email: string
}

export function AuthorizeManagerModal({ isOpen, onClose, onAuthorizeSuccess }: AuthorizeManagerModalProps) {
  const { user } = useAuth()
  const [managers, setManagers] = useState<Manager[]>([])
  const [selectedManagerId, setSelectedManagerId] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!isOpen || !user?.uid) return
    loadManagers()
  }, [isOpen, user?.uid])

  const loadManagers = async () => {
    setLoading(true)
    try {
      const result = await getAvailablePropertyManagers(user!.uid)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setManagers(result.managers || [])
      if (result.managers && result.managers.length === 0) {
        toast.info("No available managers to authorize")
      }
    } catch (error) {
      console.error("[v0] Error loading managers:", error)
      toast.error("Failed to load available managers")
    } finally {
      setLoading(false)
    }
  }

  const filteredManagers = useMemo(() => {
    if (!searchQuery.trim()) return []

    const query = searchQuery.toLowerCase()
    return managers.filter((m) => {
      const fullName = `${m.first_name} ${m.last_name}`.toLowerCase()
      const email = m.email.toLowerCase()
      return fullName.includes(query) || email.includes(query)
    })
  }, [managers, searchQuery])

  const handleAuthorize = async () => {
    if (!selectedManagerId) {
      toast.error("Please select a manager")
      return
    }

    setSubmitting(true)
    try {
      const result = await authorizePropertyManager(user!.uid, selectedManagerId)
      if (result.error) {
        toast.error(result.error)
        return
      }

      const selectedManager = managers.find((m) => m.id === selectedManagerId)
      toast.success(`${selectedManager?.first_name} ${selectedManager?.last_name} has been authorized`)
      setSelectedManagerId("")
      setSearchQuery("")
      onAuthorizeSuccess()
      onClose()
    } catch (error) {
      console.error("[v0] Error authorizing manager:", error)
      toast.error("Failed to authorize manager")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Authorize Property Manager</DialogTitle>
          <DialogDescription>Search and authorize a property manager to manage your properties</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading managers...</p>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {searchQuery.trim() && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {filteredManagers.length > 0 ? (
                    filteredManagers.map((manager) => (
                      <button
                        key={manager.id}
                        onClick={() => setSelectedManagerId(manager.id)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                          selectedManagerId === manager.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-muted-foreground/50"
                        }`}
                      >
                        <p className="font-medium text-sm">
                          {manager.first_name} {manager.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{manager.email}</p>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-sm">No managers found matching your search</p>
                    </div>
                  )}
                </div>
              )}

              {!searchQuery.trim() && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">Start typing to search for managers</p>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleAuthorize} disabled={submitting || !selectedManagerId}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Authorize
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
