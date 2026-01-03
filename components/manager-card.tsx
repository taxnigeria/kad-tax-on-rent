"use client"

import { ChevronRight } from "lucide-react"

interface ManagerCardProps {
  name: string
  email: string
  authorizationDate: string
  propertyCount: number
  onClick: () => void
}

export function ManagerCard({ name, email, authorizationDate, propertyCount, onClick }: ManagerCardProps) {
  const handleClick = () => {
    console.log("[v0] Manager card clicked:", name)
    onClick()
  }

  return (
    <button
      onClick={handleClick}
      className="w-full border border-border rounded-lg p-4 hover:bg-accent transition-colors text-left group"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{name}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Authorization Date</p>
            <p className="text-sm font-medium">{new Date(authorizationDate).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Properties</p>
            <p className="text-sm font-medium">{propertyCount}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </button>
  )
}
