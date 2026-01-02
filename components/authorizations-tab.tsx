"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getManagerAuthorizationsForOwner, revokeManagerAuthorization } from "@/app/actions/manager-authorizations"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Trash2, UserCheck, Calendar, Plus } from "lucide-react"
import { AuthorizeManagerModal } from "./authorize-manager-modal"

interface Authorization {
  id: string
  manager_id: string
  owner_id: string
  is_active: boolean
  created_at: string
  authorization_date: string
  users: {
    id: string
    first_name: string
    last_name: string
    email: string
  }
}

export function AuthorizationsTab() {
  const { user } = useAuth()
  const [authorizations, setAuthorizations] = useState<Authorization[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (!user?.uid) return

    loadAuthorizations()
  }, [user?.uid])

  const loadAuthorizations = async () => {
    setLoading(true)
    try {
      const result = await getManagerAuthorizationsForOwner(user!.uid)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setAuthorizations(result.authorizations || [])
    } catch (error) {
      console.error("[v0] Error loading authorizations:", error)
      toast.error("Failed to load authorizations")
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (authorizationId: string, managerName: string) => {
    try {
      const result = await revokeManagerAuthorization(authorizationId)
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success(`Authorization for ${managerName} has been revoked`)
      setAuthorizations(authorizations.filter((a) => a.id !== authorizationId))
    } catch (error) {
      console.error("[v0] Error revoking authorization:", error)
      toast.error("Failed to revoke authorization")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading authorizations...</p>
      </div>
    )
  }

  if (authorizations.length === 0) {
    return (
      <>
        <Card className="border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCheck className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No authorized managers</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              You haven't authorized any property managers yet. Authorize a manager to allow them to manage your
              properties.
            </p>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Authorize Manager
            </Button>
          </CardContent>
        </Card>

        <AuthorizeManagerModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onAuthorizeSuccess={loadAuthorizations}
        />
      </>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold">Authorized Managers</h3>
          <Button size="sm" onClick={() => setIsModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Manager
          </Button>
        </div>

        <div className="grid gap-4">
          {authorizations.map((auth) => (
            <Card key={auth.id} className="border-border/50">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base">
                      {auth.users.first_name} {auth.users.last_name}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1">{auth.users.email}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Authorized on {new Date(auth.authorization_date || auth.created_at).toLocaleDateString()}</span>
                </div>
                <div className="pt-4 border-t border-border/50">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full gap-2"
                    onClick={() => handleRevoke(auth.id, `${auth.users.first_name} ${auth.users.last_name}`)}
                  >
                    <Trash2 className="h-4 w-4" />
                    Revoke Access
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AuthorizeManagerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAuthorizeSuccess={loadAuthorizations}
      />
    </>
  )
}
