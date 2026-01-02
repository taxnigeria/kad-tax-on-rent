"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { getManagerAuthorizationsForOwner } from "@/app/actions/manager-authorizations"
import { getPropertiesByFirebaseUid } from "@/app/actions/get-properties"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { UserCheck, Plus } from "lucide-react"
import { AuthorizeManagerModal } from "./authorize-manager-modal"
import { ManagerDetailSidepanel } from "./manager-detail-sidepanel"
import { ManagerCard } from "./manager-card"

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

interface Property {
  id: string
  registered_property_name: string
}

export function AuthorizationsTab() {
  const { user } = useAuth()
  const [authorizations, setAuthorizations] = useState<Authorization[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedManager, setSelectedManager] = useState<{
    id: string
    authId: string
  } | null>(null)
  const [isSidepanelOpen, setIsSidepanelOpen] = useState(false)

  useEffect(() => {
    if (!user?.uid) return
    loadData()
  }, [user?.uid])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load authorizations
      const authResult = await getManagerAuthorizationsForOwner(user!.uid)
      if (authResult.error) {
        toast.error(authResult.error)
      } else {
        setAuthorizations(authResult.authorizations || [])
      }

      // Load properties to show available ones for assignment
      const propResult = await getPropertiesByFirebaseUid(user!.uid)
      if (!propResult.error && propResult.ownedProperties) {
        setProperties(propResult.ownedProperties)
      }
    } catch (error) {
      console.error("[v0] Error loading data:", error)
      toast.error("Failed to load authorizations")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenManager = (managerId: string, authId: string) => {
    setSelectedManager({ id: managerId, authId })
    setIsSidepanelOpen(true)
  }

  const handleRevoked = () => {
    loadData()
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
          onAuthorizeSuccess={loadData}
        />
      </>
    )
  }

  const availablePropertiesForManager = (managerId: string) => {
    const managedPropIds = properties
      .filter((p) => authorizations.some((a) => a.manager_id === managerId))
      .map((p) => p.id)

    return properties.filter((p) => !managedPropIds.includes(p.id))
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

        <div className="space-y-2">
          {authorizations.map((auth) => (
            <ManagerCard
              key={auth.id}
              name={`${auth.users.first_name} ${auth.users.last_name}`}
              email={auth.users.email}
              authorizationDate={auth.authorization_date || auth.created_at}
              propertyCount={properties.filter((p) => auth.manager_id === auth.manager_id).length}
              onClick={() => handleOpenManager(auth.manager_id, auth.id)}
            />
          ))}
        </div>
      </div>

      <AuthorizeManagerModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAuthorizeSuccess={loadData} />

      {selectedManager && (
        <ManagerDetailSidepanel
          isOpen={isSidepanelOpen}
          onClose={() => {
            setIsSidepanelOpen(false)
            setSelectedManager(null)
          }}
          managerId={selectedManager.id}
          authorizationId={selectedManager.authId}
          ownerId={user!.uid}
          onRevoked={handleRevoked}
          onPropertyAdded={loadData}
          availableProperties={selectedManager ? availablePropertiesForManager(selectedManager.id) : []}
        />
      )}
    </>
  )
}
