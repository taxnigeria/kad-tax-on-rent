import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export default function UsersLoading() {
  return (
    <div className="flex h-screen">
      {/* Sidebar skeleton */}
      <div className="w-64 border-r bg-muted/10 p-4">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="mb-4">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Card key={i} className="py-3 px-4">
              <Skeleton className="h-3 w-16 mb-2" />
              <Skeleton className="h-5 w-12" />
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Skeleton className="h-10 w-48 mb-4" />

        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <Skeleton className="h-9 flex-1" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-9 w-24" />
        </div>

        {/* Table */}
        <Card className="p-0">
          <div className="p-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex gap-4 py-3 border-b last:border-0">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
