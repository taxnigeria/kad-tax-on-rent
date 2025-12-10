"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Medal, Award, TrendingUp } from "lucide-react"

interface LeaderboardEntry {
  id: string
  name: string
  totalProperties: number
  verifiedProperties: number
  approvalRate: number
  isCurrentUser: boolean
}

export default function LeaderboardPage() {
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState<number>(0)
  const [loading, setLoading] = useState(true)

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

      loadLeaderboard()
    }
  }, [user, userRole, authLoading, router])

  const loadLeaderboard = async () => {
    try {
      const res = await fetch("/api/enumerator/leaderboard")
      if (res.ok) {
        const data = await res.json()
        setLeaderboard(data.leaderboard)
        setUserRank(data.userRank)
      }
    } catch (error) {
      console.error("[v0] Failed to load leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return null
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  if (authLoading || loading) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Your Position Skeleton */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leaderboard Skeleton */}
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  const currentUser = leaderboard.find((entry) => entry.isCurrentUser)

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">See how you rank against other field agents</p>
      </div>

      {/* Your Position */}
      {currentUser && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-primary text-primary-foreground text-2xl font-bold">
                #{userRank}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">{currentUser.name}</h3>
                  <Badge>You</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentUser.totalProperties} properties • {currentUser.verifiedProperties} verified •{" "}
                  {currentUser.approvalRate}% approval rate
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>All Field Agents</CardTitle>
          <CardDescription>Ranked by total verified properties</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {leaderboard.map((agent, index) => (
            <div
              key={agent.id}
              className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                agent.isCurrentUser ? "bg-primary/10 border border-primary/20" : "bg-muted/50 hover:bg-muted"
              }`}
            >
              {/* Rank */}
              <div className="flex items-center justify-center w-8 h-8">
                {getRankIcon(index + 1) || <span className="font-bold text-muted-foreground">{index + 1}</span>}
              </div>

              {/* Avatar */}
              <Avatar className="h-10 w-10">
                <AvatarFallback className={index < 3 ? "bg-primary/20 text-primary" : ""}>
                  {getInitials(agent.name)}
                </AvatarFallback>
              </Avatar>

              {/* Name and Stats */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {agent.name}
                  {agent.isCurrentUser && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      You
                    </Badge>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {agent.totalProperties} properties • {agent.approvalRate}% approved
                </p>
              </div>

              {/* Verified Count */}
              <div className="text-right">
                <p className="font-bold text-lg">{agent.verifiedProperties}</p>
                <p className="text-xs text-muted-foreground">verified</p>
              </div>
            </div>
          ))}

          {leaderboard.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No leaderboard data available yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
