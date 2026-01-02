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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

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
          <DialogDescription>Select a property manager to authorize for your properties</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-muted-foreground">Loading available managers...</p>
            </div>
          ) : managers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No available managers to authorize</p>
            </div>
          ) : (
            <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    <div className="flex flex-col gap-1">
                      <span>
                        {manager.first_name} {manager.last_name}
                      </span>
                      <span className="text-xs text-muted-foreground">{manager.email}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleAuthorize} disabled={submitting || !selectedManagerId || managers.length === 0}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Authorize
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
