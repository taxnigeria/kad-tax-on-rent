"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Building2, Users, CheckCircle, Clock, XCircle, TrendingUp, Plus } from "lucide-react"
import { getUserRole } from "@/app/actions/get-user-role"

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

export default function EnumeratorDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<EnumeratorStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkRole = async () => {
      const role = await getUserRole()
      if (role !== "enumerator") {
        router.push("/login")
        return
      }

      await loadData()
    }

    checkRole()
  }, [router])

  const loadData = async () => {
    try {
      // Load stats and leaderboard in parallel
      const [statsRes, leaderboardRes] = await Promise.all([
        fetch("/api/enumerator/stats"),
        fetch("/api/enumerator/leaderboard"),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading dashboard...</p>
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
        <Button onClick={() => router.push("/enumerator-dashboard/enumerate")} size="lg" className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Register New Property
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalProperties || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.thisWeekProperties || 0} this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.verifiedProperties || 0}</div>
            <p className="text-xs text-muted-foreground">{stats?.approvalRate || 0}% approval rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats?.pendingProperties || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting admin approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span className="text-xs text-muted-foreground">Verified</span>
                </div>
                <div className="text-lg font-bold">{stats?.verifiedProperties || 0}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="h-3 w-3 text-yellow-600" />
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
                <div className="text-lg font-bold">{stats?.pendingProperties || 0}</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <XCircle className="h-3 w-3 text-red-600" />
                  <span className="text-xs text-muted-foreground">Rejected</span>
                </div>
                <div className="text-lg font-bold">{stats?.rejectedProperties || 0}</div>
              </div>
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

        {/* Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard</CardTitle>
            <CardDescription>Top performing field agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leaderboard.slice(0, 5).map((agent, index) => (
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
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
