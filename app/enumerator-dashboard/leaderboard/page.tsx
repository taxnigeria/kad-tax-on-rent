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
    if (!user) return

    try {
      const res = await fetch(`/api/enumerator/leaderboard?firebaseUid=${user.uid}`)
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
    <div className="flex-1 space-y-6 p-4 md:p-8 pb-24 md:pb-8">
      {/* Header - hidden on mobile since AppBar shows it */}
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-sm text-muted-foreground">See how you rank against other field agents</p>
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>This month's leading field agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-center gap-4">
              {/* 2nd Place */}
              <div className="flex flex-col items-center">
                <Avatar className="w-16 h-16 mb-2 ring-4 ring-gray-300">
                  <AvatarFallback className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100 text-lg">
                    {getInitials(leaderboard[1]?.name || "")}
                  </AvatarFallback>
                </Avatar>
                <Medal className="h-6 w-6 text-gray-400 mb-1" />
                <p className="text-sm font-medium text-center truncate w-24">{leaderboard[1]?.name?.split(" ")[0]}</p>
                <p className="text-xs text-muted-foreground">{leaderboard[1]?.verifiedProperties} verified</p>
                <div className="w-24 h-20 bg-gray-100 dark:bg-gray-800 rounded-t-lg mt-3 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-500">2</span>
                </div>
              </div>

              {/* 1st Place */}
              <div className="flex flex-col items-center -mt-6">
                <Avatar className="w-20 h-20 mb-2 ring-4 ring-yellow-400">
                  <AvatarFallback className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 text-xl">
                    {getInitials(leaderboard[0]?.name || "")}
                  </AvatarFallback>
                </Avatar>
                <Trophy className="h-8 w-8 text-yellow-500 mb-1" />
                <p className="text-base font-semibold text-center truncate w-28">
                  {leaderboard[0]?.name?.split(" ")[0]}
                </p>
                <p className="text-xs text-muted-foreground">{leaderboard[0]?.verifiedProperties} verified</p>
                <div className="w-28 h-28 bg-yellow-100 dark:bg-yellow-900/50 rounded-t-lg mt-3 flex items-center justify-center">
                  <span className="text-4xl font-bold text-yellow-600 dark:text-yellow-400">1</span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="flex flex-col items-center">
                <Avatar className="w-16 h-16 mb-2 ring-4 ring-amber-500">
                  <AvatarFallback className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 text-lg">
                    {getInitials(leaderboard[2]?.name || "")}
                  </AvatarFallback>
                </Avatar>
                <Award className="h-6 w-6 text-amber-600 mb-1" />
                <p className="text-sm font-medium text-center truncate w-24">{leaderboard[2]?.name?.split(" ")[0]}</p>
                <p className="text-xs text-muted-foreground">{leaderboard[2]?.verifiedProperties} verified</p>
                <div className="w-24 h-16 bg-amber-100 dark:bg-amber-900/50 rounded-t-lg mt-3 flex items-center justify-center">
                  <span className="text-3xl font-bold text-amber-600 dark:text-amber-400">3</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Your Position */}
      {currentUser && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center h-14 w-14 md:h-16 md:w-16 rounded-full bg-primary text-primary-foreground text-xl md:text-2xl font-bold">
                #{userRank}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base md:text-lg font-semibold truncate">{currentUser.name}</h3>
                  <Badge>You</Badge>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {currentUser.totalProperties} properties • {currentUser.verifiedProperties} verified •{" "}
                  {currentUser.approvalRate}% rate
                </p>
              </div>
              <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-primary hidden sm:block" />
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
              className={`flex items-center gap-3 md:gap-4 p-3 md:p-4 rounded-lg transition-colors ${
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
                <p className="font-medium truncate text-sm md:text-base">
                  {agent.name}
                  {agent.isCurrentUser && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      You
                    </Badge>
                  )}
                </p>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {agent.totalProperties} properties • {agent.approvalRate}% approved
                </p>
              </div>

              {/* Verified Count */}
              <div className="text-right">
                <p className="font-bold text-base md:text-lg">{agent.verifiedProperties}</p>
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
