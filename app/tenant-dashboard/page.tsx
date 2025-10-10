"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { TenantSidebar } from "@/components/tenant-sidebar"
import { TenantHeader } from "@/components/tenant-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Building2, FileText, CreditCard, AlertCircle, LinkIcon, Loader2 } from "lucide-react"
import { AIAssistantSidebar } from "@/components/ai-assistant-sidebar"
import { createBrowserClient } from "@/utils/supabase/client"
import { formatCurrency } from "@/lib/utils"
import { ProfileCompletionModal } from "@/components/profile-completion-modal"
import { ProfileCompletionCard } from "@/components/profile-completion-card"

interface DashboardStats {
  totalRentals: number
  pendingInvoices: number
  totalPaid: number
  outstanding: number
}

export default function TenantDashboardPage() {
  const router = useRouter()
  const { user, userRole, loading } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalRentals: 0,
    pendingInvoices: 0,
    totalPaid: 0,
    outstanding: 0,
  })
  const [loadingData, setLoadingData] = useState(true)
  const [showProfileCompletion, setShowProfileCompletion] = useState(false)

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (userRole && userRole !== "tenant") {
        if (["taxpayer", "property_manager"].includes(userRole)) {
          router.push("/taxpayer-dashboard")
        } else {
          router.push("/dashboard")
        }
      }
    }
  }, [user, userRole, loading, router])

  useEffect(() => {
    if (user && userRole === "tenant") {
      checkFirstLogin()
      loadDashboardData()
    }
  }, [user, userRole])

  const loadDashboardData = async () => {
    if (!user) return

    setLoadingData(true)
    const supabase = createBrowserClient()

    try {
      // Fetch database user ID using firebase_uid
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("firebase_uid", user.uid)
        .single()

      if (userError || !userData) {
        console.error("Error fetching user:", userError)
        return
      }

      const userId = userData.id

      // Fetch tenant rentals count
      const { count: rentalsCount } = await supabase
        .from("tenant_rentals")
        .select("*", { count: "exact", head: true })
        .eq("tenant_id", userId)
        .eq("is_active", true)

      setStats({
        totalRentals: rentalsCount || 0,
        pendingInvoices: 0,
        totalPaid: 0,
        outstanding: 0,
      })
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    } finally {
      setLoadingData(false)
    }
  }

  const checkFirstLogin = async () => {
    if (!user) return

    const supabase = createBrowserClient()
    const { data: userData } = await supabase.from("users").select("id").eq("firebase_uid", user.uid).single()

    if (userData) {
      const { data: profileData } = await supabase
        .from("taxpayer_profiles")
        .select("profile_completion_dismissed, last_profile_check")
        .eq("user_id", userData.id)
        .single()

      const shouldShow =
        !profileData?.profile_completion_dismissed ||
        !profileData?.last_profile_check ||
        new Date().getTime() - new Date(profileData.last_profile_check).getTime() > 7 * 24 * 60 * 60 * 1000

      if (shouldShow) {
        setShowProfileCompletion(true)
      }
    }
  }

  const handleLinkProperty = () => {
    router.push("/tenant-dashboard/properties")
  }

  const handleViewInvoices = () => {
    router.push("/tenant-dashboard/invoices")
  }

  const handleMakePayment = () => {
    router.push("/tenant-dashboard/invoices?filter=unpaid")
  }

  if (!user || (userRole && userRole !== "tenant")) {
    if (loading) {
      return (
        <SidebarProvider
          style={
            {
              "--sidebar-width": "calc(var(--spacing) * 72)",
              "--header-height": "calc(var(--spacing) * 12)",
            } as React.CSSProperties
          }
        >
          <TenantSidebar variant="inset" />
          <SidebarInset>
            <TenantHeader />
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <Loader2 className="inline-block h-8 w-8 animate-spin" />
                <p className="mt-4 text-muted-foreground">Loading...</p>
              </div>
            </div>
          </SidebarInset>
          <AIAssistantSidebar userRole="tenant" />
        </SidebarProvider>
      )
    }
    return null
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <TenantSidebar variant="inset" />
      <SidebarInset>
        <TenantHeader />
        <div className="flex flex-1 flex-col overflow-x-hidden">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold tracking-tight">Welcome back!</h1>
                  <p className="text-muted-foreground">Manage your rentals and tax payments</p>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">My Rentals</CardTitle>
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      {loadingData ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <div className="text-2xl font-bold">{stats.totalRentals}</div>
                          <p className="text-xs text-muted-foreground">
                            {stats.totalRentals === 0 ? "No rentals linked yet" : "Active rentals"}
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Pending Invoices</CardTitle>
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      {loadingData ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <div className="text-2xl font-bold">{stats.pendingInvoices}</div>
                          <p className="text-xs text-muted-foreground">
                            {stats.pendingInvoices === 0 ? "All caught up!" : "Requires payment"}
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      {loadingData ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <div className="text-2xl font-bold">{formatCurrency(stats.totalPaid)}</div>
                          <p className="text-xs text-muted-foreground">Total payments made</p>
                        </>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      {loadingData ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <div className="text-2xl font-bold">{formatCurrency(stats.outstanding)}</div>
                          <p className="text-xs text-muted-foreground">
                            {stats.outstanding === 0 ? "No outstanding balance" : "Balance due"}
                          </p>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Profile Completion Card */}
                <div className="mb-6">
                  <ProfileCompletionCard onViewDetails={() => setShowProfileCompletion(true)} />
                </div>

                {/* Quick Actions */}
                <div className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Get started with common tasks</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      <Button
                        className="h-auto flex-col items-start gap-2 p-4 bg-transparent"
                        variant="outline"
                        onClick={handleLinkProperty}
                      >
                        <LinkIcon className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-semibold">Link Property</div>
                          <div className="text-xs text-muted-foreground">Connect to your rental property</div>
                        </div>
                      </Button>

                      <Button
                        className="h-auto flex-col items-start gap-2 p-4 bg-transparent"
                        variant="outline"
                        onClick={handleViewInvoices}
                      >
                        <FileText className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-semibold">View Invoices</div>
                          <div className="text-xs text-muted-foreground">Check your tax invoices</div>
                        </div>
                      </Button>

                      <Button
                        className="h-auto flex-col items-start gap-2 p-4 bg-transparent"
                        variant="outline"
                        onClick={handleMakePayment}
                      >
                        <CreditCard className="h-5 w-5" />
                        <div className="text-left">
                          <div className="font-semibold">Make Payment</div>
                          <div className="text-xs text-muted-foreground">Pay your tax portion</div>
                        </div>
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Getting Started Guide */}
                {stats.totalRentals === 0 && (
                  <div className="mt-6">
                    <Card className="border-blue-200 bg-blue-50/50">
                      <CardHeader>
                        <CardTitle className="text-blue-900">Getting Started</CardTitle>
                        <CardDescription className="text-blue-700">
                          Follow these steps to start managing your rental tax payments
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                            1
                          </div>
                          <div>
                            <p className="font-medium text-blue-900">Link Your Rental Property</p>
                            <p className="text-sm text-blue-700">
                              Search for and connect to the property you're renting
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                            2
                          </div>
                          <div>
                            <p className="font-medium text-blue-900">Wait for Verification</p>
                            <p className="text-sm text-blue-700">
                              Admin will verify your rental details and approve the link
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                            3
                          </div>
                          <div>
                            <p className="font-medium text-blue-900">Receive Invoices</p>
                            <p className="text-sm text-blue-700">
                              You'll receive invoices for your portion of the withholding tax
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                            4
                          </div>
                          <div>
                            <p className="font-medium text-blue-900">Make Payments</p>
                            <p className="text-sm text-blue-700">
                              Pay your tax portion securely online through the portal
                            </p>
                          </div>
                        </div>
                        <Button onClick={handleLinkProperty} className="w-full mt-4">
                          <LinkIcon className="mr-2 h-4 w-4" />
                          Link Your First Property
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
      <AIAssistantSidebar userRole="tenant" />

      {/* Profile Completion Modal */}
      <ProfileCompletionModal
        open={showProfileCompletion}
        onOpenChange={setShowProfileCompletion}
        onDismiss={() => setShowProfileCompletion(false)}
      />
    </SidebarProvider>
  )
}
