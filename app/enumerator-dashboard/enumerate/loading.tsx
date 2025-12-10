import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function EnumerateLoading() {
  return (
    <div className="flex-1 p-4 max-w-2xl mx-auto space-y-6">
      {/* Back Button */}
      <Skeleton className="h-10 w-40" />

      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-24" />
      </div>

      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        <Skeleton className="flex-1 h-2 rounded-full" />
        <Skeleton className="flex-1 h-2 rounded-full" />
        <Skeleton className="flex-1 h-2 rounded-full" />
        <Skeleton className="flex-1 h-2 rounded-full" />
      </div>

      {/* Form Card */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-24 w-full" />
          <div className="flex gap-2 pt-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
