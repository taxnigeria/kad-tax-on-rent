"use client"

import { useAuth } from "@/contexts/auth-context"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Building2, Key, Users } from "lucide-react"
import { useState } from "react"

const roles = [
  {
    id: "taxpayer",
    label: "Property Owner",
    description: "I own rental properties and need to pay withholding tax",
    icon: Building2,
  },
  {
    id: "enumerator",
    label: "Tenant",
    description: "I rent a property and want to pay my portion of tax",
    icon: Key,
  },
  {
    id: "property_manager",
    label: "Property Manager",
    description: "I manage properties on behalf of owners",
    icon: Users,
  },
]

export function GoogleRoleSelectionModal() {
  const { pendingGoogleUser, confirmGoogleRole } = useAuth()
  const [selectedRole, setSelectedRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!selectedRole) return
    setLoading(true)
    await confirmGoogleRole(selectedRole)
    setLoading(false)
    setSelectedRole(null) // Reset role selection after confirmation
  }

  return (
    <Dialog open={!!pendingGoogleUser} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>Select the role that best describes you to get started</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {roles.map((role) => {
            const Icon = role.icon
            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`w-full flex items-start gap-3 p-4 rounded-lg border-2 transition-all ${
                  selectedRole === role.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-accent"
                }`}
              >
                <Icon className="w-5 h-5 mt-1 flex-shrink-0" />
                <div className="text-left flex-1">
                  <p className="font-medium">{role.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{role.description}</p>
                </div>
              </button>
            )
          })}
        </div>

        <Button onClick={handleConfirm} disabled={!selectedRole || loading} className="w-full mt-4">
          {loading ? "Setting up account..." : "Continue"}
        </Button>
      </DialogContent>
    </Dialog>
  )
}
