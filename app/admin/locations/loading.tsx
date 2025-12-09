import { Skeleton } from "@/components/ui/skeleton"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Card } from "@/components/ui/card"

export default function LocationsLoading() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Skeleton className="h-8 w-32" />

          {/* Tabs skeleton */}
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-9 w-20" />
          </div>

          {/* Stats cards skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="py-3 px-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-5 w-12" />
                  </div>
                  <Skeleton className="h-4 w-4" />
                </div>
              </Card>
            ))}
          </div>

          {/* Filters skeleton */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 flex-1 max-w-md" />
            <Skeleton className="h-9 w-24" />
          </div>

          {/* Table skeleton */}
          <Card className="p-4">
            <div className="space-y-3">
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-4 flex-1" />
                ))}
              </div>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((row) => (
                <div key={row} className="flex gap-4">
                  {[1, 2, 3, 4, 5, 6].map((col) => (
                    <Skeleton key={col} className="h-8 flex-1" />
                  ))}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
