import { Badge } from "@/components/ui/badge"

interface InvoiceStatusBadgeProps {
  status: string
  dueDate?: string
}

export function InvoiceStatusBadge({ status, dueDate }: InvoiceStatusBadgeProps) {
  const today = new Date().toISOString().split("T")[0]
  const isOverdue = dueDate && dueDate < today && status !== "paid"

  const getStatusConfig = () => {
    if (isOverdue) {
      return {
        label: "Overdue",
        variant: "destructive" as const,
      }
    }

    switch (status) {
      case "paid":
        return {
          label: "Paid",
          variant: "default" as const,
        }
      case "partial":
        return {
          label: "Partially Paid",
          variant: "secondary" as const,
        }
      case "unpaid":
        return {
          label: "Unpaid",
          variant: "outline" as const,
        }
      case "cancelled":
        return {
          label: "Cancelled",
          variant: "outline" as const,
        }
      default:
        return {
          label: status,
          variant: "outline" as const,
        }
    }
  }

  const config = getStatusConfig()

  return <Badge variant={config.variant}>{config.label}</Badge>
}
