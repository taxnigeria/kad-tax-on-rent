"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  Calculator,
  CreditCard,
  FileText,
  Search,
  Settings,
  Users,
  Building2,
  BarChart3,
  Database,
  Table,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"

export function CommandSearch() {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const runCommand = React.useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2 w-full justify-between text-muted-foreground border-transparent shadow-none"
      >
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline-flex">Search...</span>
        </div>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search actions, pages, or database..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup heading="Quick Actions">
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push("/dashboard/taxpayers/add"))
              }}
            >
              <Users className="mr-2 h-4 w-4" />
              <span>Add New Taxpayer</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push("/dashboard/properties/add"))
              }}
            >
              <Building2 className="mr-2 h-4 w-4" />
              <span>Add New Property</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push("/dashboard/invoices/create"))
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>Create Invoice</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Navigation">
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push("/dashboard"))
              }}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push("/dashboard/taxpayers"))
              }}
            >
              <Users className="mr-2 h-4 w-4" />
              <span>Taxpayers</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push("/dashboard/properties"))
              }}
            >
              <Building2 className="mr-2 h-4 w-4" />
              <span>Properties</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push("/dashboard/invoices"))
              }}
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>Invoices</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push("/dashboard/payments"))
              }}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Payments</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push("/dashboard/tax-calculations"))
              }}
            >
              <Calculator className="mr-2 h-4 w-4" />
              <span>Tax Calculations</span>
            </CommandItem>
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push("/dashboard/reports"))
              }}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              <span>Reports</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Database Search">
            <CommandItem disabled>
              <Database className="mr-2 h-4 w-4" />
              <span className="text-muted-foreground">Search Taxpayers (Coming Soon)</span>
            </CommandItem>
            <CommandItem disabled>
              <Table className="mr-2 h-4 w-4" />
              <span className="text-muted-foreground">Search Properties (Coming Soon)</span>
            </CommandItem>
            <CommandItem disabled>
              <FileText className="mr-2 h-4 w-4" />
              <span className="text-muted-foreground">Search Invoices (Coming Soon)</span>
            </CommandItem>
            <CommandItem disabled>
              <CreditCard className="mr-2 h-4 w-4" />
              <span className="text-muted-foreground">Search Payments (Coming Soon)</span>
            </CommandItem>
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Settings">
            <CommandItem
              onSelect={() => {
                runCommand(() => router.push("/admin/settings"))
              }}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>System Settings</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
