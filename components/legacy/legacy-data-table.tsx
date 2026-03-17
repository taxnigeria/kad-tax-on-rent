"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Loader2, ChevronLeft, ChevronRight, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface LegacyDataTableProps {
  type: "taxpayers" | "enumerations" | "invoices"
  data: any[]
  loading: boolean
  onRowClick: (item: any) => void
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  pagination: {
    page: number
    limit: number
    total: number
  }
  onPageChange: (page: number) => void
  sortConfig?: {
    field: string
    order: "asc" | "desc"
  }
  onSort?: (field: string) => void
}

export function LegacyDataTable({
  type,
  data,
  loading,
  onRowClick,
  selectedIds,
  onSelectionChange,
  pagination,
  onPageChange,
  sortConfig,
  onSort
}: LegacyDataTableProps) {
  
  const totalPages = Math.ceil(pagination.total / pagination.limit)

  const toggleAll = () => {
    if (selectedIds.length === data.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(data.map(item => item.id || item.uid))
    }
  }

  const toggleOne = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id))
    } else {
      onSelectionChange([...selectedIds, id])
    }
  }

  const SortButton = ({ field, label }: { field: string, label: string }) => {
    if (!onSort || !sortConfig) return <span>{label}</span>
    
    const isActive = sortConfig.field === field
    const Icon = !isActive ? ArrowUpDown : sortConfig.order === "asc" ? ChevronUp : ChevronDown
    
    return (
      <Button 
        variant="ghost" 
        size="sm" 
        className={cn("-ml-3 h-8 data-[state=open]:bg-accent", isActive && "text-primary font-bold")}
        onClick={(e) => {
          e.stopPropagation()
          onSort(field)
        }}
      >
        <span>{label}</span>
        <Icon className="ml-2 h-4 w-4" />
      </Button>
    )
  }

  const getSerialNumber = (index: number) => {
    return (pagination.page - 1) * pagination.limit + index + 1
  }

  // Helper to format timestamps from Firebase
  const formatDate = (dateValue: any) => {
    if (!dateValue) return "N/A"
    try {
      if (dateValue && typeof dateValue === 'object' && 'seconds' in dateValue) {
        return format(new Date(dateValue.seconds * 1000), "MMM d, yyyy")
      }
      return format(new Date(dateValue), "MMM d, yyyy")
    } catch {
      return "N/A"
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Fetching legacy data...</p>
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 border rounded-lg border-dashed">
        <p className="text-muted-foreground">No legacy records found.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted hover:bg-muted">
              <TableHead className="w-[40px] px-4">
                <Checkbox 
                  checked={data.length > 0 && selectedIds.length === data.length}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="w-[60px]">S/N</TableHead>
              {type === "taxpayers" && (
                <>
                  <TableHead><SortButton field="kadirs_id" label="Kadirs ID" /></TableHead>
                  <TableHead><SortButton field="tin" label="TIN" /></TableHead>
                  <TableHead><SortButton field="displayName" label="Name" /></TableHead>
                  <TableHead><SortButton field="email" label="Email" /></TableHead>
                  <TableHead><SortButton field="phoneNumber" label="Phone" /></TableHead>
                  <TableHead><SortButton field="user_type" label="Type" /></TableHead>
                  <TableHead><SortButton field="creationTime" label="Joined" /></TableHead>
                </>
              )}
              {type === "enumerations" && (
                <>
                  <TableHead><SortButton field="property_name" label="Property (Ref)" /></TableHead>
                  <TableHead><SortButton field="owner_name" label="Owner" /></TableHead>
                  <TableHead><SortButton field="lga" label="LGA / Area Office" /></TableHead>
                  <TableHead><SortButton field="status" label="Status" /></TableHead>
                  <TableHead><SortButton field="date_created" label="Date Created" /></TableHead>
                </>
              )}
              {type === "invoices" && (
                <>
                  <TableHead><SortButton field="billReference" label="Bill Ref" /></TableHead>
                  <TableHead><SortButton field="amount" label="Amount" /></TableHead>
                  <TableHead><SortButton field="taxpayer_name" label="Payer" /></TableHead>
                  <TableHead><SortButton field="payStatus" label="Payment Status" /></TableHead>
                  <TableHead><SortButton field="dateCreated" label="Date Issued" /></TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, index) => {
              const id = item.id || item.uid
              return (
                <TableRow 
                  key={id || index} 
                  className={`cursor-pointer hover:bg-muted/50 ${selectedIds.includes(id) ? 'bg-primary/5' : ''}`}
                  onClick={() => onRowClick(item)}
                >
                  <TableCell className="px-4" onClick={(e) => e.stopPropagation()}>
                    <Checkbox 
                      checked={selectedIds.includes(id)}
                      onCheckedChange={() => toggleOne(id)}
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono">{getSerialNumber(index)}</TableCell>
                  
                  {type === "taxpayers" && (
                    <>
                      <TableCell className="font-mono text-xs font-bold text-primary">
                        {item.kadirs_id || item.kadirsId || "N/A"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {item.tin || "N/A"}
                      </TableCell>
                      <TableCell className="font-medium capitalize whitespace-nowrap">
                        {item.displayName || "N/A"}
                      </TableCell>
                      <TableCell className="text-xs truncate max-w-[150px]">{item.email || "N/A"}</TableCell>
                      <TableCell className="font-mono text-[10px] whitespace-nowrap">{item.phoneNumber || item.phone || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] font-bold uppercase py-0 h-5">
                          {item.user_type || item.userType || "Individual"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">
                        {formatDate(item.created_time || item.creationTime)}
                      </TableCell>
                    </>
                  )}
                  
                  {type === "enumerations" && (
                    <>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="font-bold">{item.property_owner_info?.registered_property_name || item.property_owner_info?.property_name || "Unnamed"}</span>
                          <span className="text-[10px] font-mono text-primary uppercase">{item.property_owner_info?.kadirs_id || id?.slice(-8)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.property_owner_info?.name_of_property_owner || item.owner_name || "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold">{item.lga || "N/A"}</span>
                          <span className="text-[10px] text-muted-foreground">{item.area_office || ""}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.status === "accepted" ? "default" : "outline"} className="capitalize">
                          {item.status || item.verification_status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(item.date_created || item.created_at)}
                      </TableCell>
                    </>
                  )}
                  
                  {type === "invoices" && (
                    <>
                      <TableCell className="font-mono text-sm font-bold text-primary">
                        {item.billReference || item.bill_reference || item.invoice_number || "N/A"}
                      </TableCell>
                      <TableCell className="font-bold whitespace-nowrap">
                        ₦{Number(item.amount || item.total_amount || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {item.narration || item.taxpayer_name || "N/A"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.payStatus?.toLowerCase() === "paid" ? "default" : "secondary"} className={item.payStatus?.toLowerCase() === "paid" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"}>
                          {item.payStatus || item.payment_status || "Unpaid"}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatDate(item.dateCreated || item.issue_date)}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-muted-foreground">
            Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
          </p>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <div className="text-sm font-medium">
              Page {pagination.page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
