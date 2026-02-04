"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import { Building2, Users, CheckCircle, Clock, XCircle, TrendingUp, Plus, Trophy, Medal, Award } from "lucide-react"
import Link from "next/link"
import { PropertiesListSheet } from "@/components/enumerator/properties-list-sheet"

interface EnumeratorStats {
  totalProperties: number
  verifiedProperties: number
  pendingProperties: number
  rejectedProperties: number
  taxpayersCreated: number
  approvalRate: number
  thisWeekProperties: number
}

interface LeaderboardEntry {
  id: string
  name: string
  totalProperties: number
  verifiedProperties: number
  approvalRate: number
  isCurrentUser: boolean
}

type PropertyStatusFilter = "verified" | "pending" | "rejected"

export default function EnumeratorDashboard() {
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<EnumeratorStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [propertiesSheetOpen, setPropertiesSheetOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<PropertyStatusFilter>("verified")

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
        return
      }

      if (userRole !== "enumerator") {
        router.push("/login")
        return
      }

      loadData()
    }
  }, [user, userRole, authLoading, router])

  const loadData = async () => {
    if (!user) return

    try {
      const [statsRes, leaderboardRes] = await Promise.all([
        fetch(`/api/enumerator/stats?firebaseUid=${user.uid}`),
        fetch(`/api/enumerator/leaderboard?firebaseUid=${user.uid}`),
      ])

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }

      if (leaderboardRes.ok) {
        const leaderboardData = await leaderboardRes.json()
        setLeaderboard(leaderboardData.leaderboard)
        setUserRank(leaderboardData.userRank)
      }
    } catch (error) {
      console.error("[v0] Failed to load dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusClick = (status: PropertyStatusFilter) => {
    setSelectedStatus(status)
    setPropertiesSheetOpen(true)
  }

  if (authLoading || loading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8">
        {/* Header Skeleton */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-full md:w-48" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance and Leaderboard Skeleton */}
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(4)].map((_, j) => (
                  <Skeleton key={j} className="h-12 w-full" />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Field Agent Dashboard</h1>
          <p className="text-sm text-muted-foreground">Track your enumeration progress and performance</p>
        </div>
        <Button asChild size="lg" className="w-full md:w-auto">
          <Link href="/enumerator-dashboard/enumerate">
            <Plus className="mr-2 h-4 w-4" />
            Register New Property
          </Link>
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="gap-0 pb-0 hover:bg-muted/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 m-0">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProperties || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.thisWeekProperties || 0} this week</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer gap-0 pb-0  hover:bg-muted/50 transition-colors"
          onClick={() => handleStatusClick("verified")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 m-0">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.verifiedProperties || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.approvalRate || 0}% approval rate</p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer gap-0 pb-0  hover:bg-muted/50 transition-colors"
          onClick={() => handleStatusClick("pending")}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 m-0">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pendingProperties || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting admin approval</p>
          </CardContent>
        </Card>

        <Card className="gap-0 pb-0  hover:bg-muted/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 m-0">
            <CardTitle className="text-sm font-medium">Taxpayers Created</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.taxpayersCreated || 0}</div>
            <p className="text-xs text-muted-foreground">New accounts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Performance</CardTitle>
            <CardDescription>Quality metrics and approval rate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Approval Rate</span>
                <span className="text-muted-foreground">{stats?.approvalRate || 0}%</span>
              </div>
              <Progress value={stats?.approvalRate || 0} className="h-2" />
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <button
                onClick={() => handleStatusClick("verified")}
                className="text-center p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-muted-foreground">Verified</span>
                </div>
                <div className="text-lg font-bold">{stats?.verifiedProperties || 0}</div>
              </button>
              <button
                onClick={() => handleStatusClick("pending")}
                className="text-center p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="h-3 w-3 text-yellow-600" />
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
                <div className="text-lg font-bold">{stats?.pendingProperties || 0}</div>
              </button>
              <button
                onClick={() => handleStatusClick("rejected")}
                className="text-center p-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <XCircle className="h-3 w-3 text-red-600" />
                  <span className="text-xs text-muted-foreground">Rejected</span>
                </div>
                <div className="text-lg font-bold">{stats?.rejectedProperties || 0}</div>
              </button>
            </div>

            {userRank > 0 && (
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Your Rank</span>
                  </div>
                  <Badge variant="secondary" className="text-lg px-3 py-1">
                    #{userRank}
                  </Badge>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leaderboard Preview */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Top Performers</CardTitle>
              <CardDescription>This month's leading field agents</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/enumerator-dashboard/leaderboard">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {leaderboard.length >= 3 ? (
              <div className="flex items-end justify-center gap-2 mb-4">
                {/* 2nd Place */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold mb-2 ${
                      leaderboard[1]?.isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {leaderboard[1]?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <Medal className="h-5 w-5 text-gray-400 mb-1" />
                  <p className="text-xs font-medium text-center truncate w-20">{leaderboard[1]?.name?.split(" ")[0]}</p>
                  <p className="text-xs text-muted-foreground">{leaderboard[1]?.verifiedProperties} verified</p>
                  <div className="w-20 h-16 bg-muted/50 rounded-t-lg mt-2 flex items-center justify-center">
                    <span className="text-2xl font-bold text-muted-foreground">2</span>
                  </div>
                </div>

                {/* 1st Place */}
                <div className="flex flex-col items-center -mt-4">
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold mb-2 ring-4 ring-yellow-400/50 ${
                      leaderboard[0]?.isCurrentUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                    }`}
                  >
                    {leaderboard[0]?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <Trophy className="h-6 w-6 text-yellow-500 mb-1" />
                  <p className="text-sm font-semibold text-center truncate w-24">
                    {leaderboard[0]?.name?.split(" ")[0]}
                  </p>
                  <p className="text-xs text-muted-foreground">{leaderboard[0]?.verifiedProperties} verified</p>
                  <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-t-lg mt-2 flex items-center justify-center">
                    <span className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">1</span>
                  </div>
                </div>

                {/* 3rd Place */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold mb-2 ${
                      leaderboard[2]?.isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    {leaderboard[2]?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <Award className="h-5 w-5 text-amber-600 mb-1" />
                  <p className="text-xs font-medium text-center truncate w-20">{leaderboard[2]?.name?.split(" ")[0]}</p>
                  <p className="text-xs text-muted-foreground">{leaderboard[2]?.verifiedProperties} verified</p>
                  <div className="w-20 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-t-lg mt-2 flex items-center justify-center">
                    <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">3</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.slice(0, 3).map((agent, index) => (
                  <div
                    key={agent.id}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      agent.isCurrentUser ? "bg-primary/10 border border-primary/20" : "bg-muted/50"
                    }`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {agent.name}
                        {agent.isCurrentUser && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            You
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {agent.totalProperties} properties • {agent.approvalRate}% approved
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {userRank > 3 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                      {userRank}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Your Position</p>
                      <p className="text-xs text-muted-foreground">Keep going to climb the ranks!</p>
                    </div>
                  </div>
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Properties List Sheet */}
      <PropertiesListSheet open={propertiesSheetOpen} onOpenChange={setPropertiesSheetOpen} status={selectedStatus} />
    </div>
  )
}
