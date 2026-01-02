"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface ExistingUserConfirmationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userData: {
    fullName: string
    kadirs_id?: string
    tpui?: string
    tin: string
    nin: string
    phone: string
    email: string
  } | null
  onConfirm: () => void
  isLoading?: boolean
}

export function ExistingUserConfirmationModal({
  open,
  onOpenChange,
  userData,
  onConfirm,
  isLoading = false,
}: ExistingUserConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <DialogTitle>Existing User Found</DialogTitle>
          </div>
          <DialogDescription>An existing KADIRS account was found with this email or phone number.</DialogDescription>
        </DialogHeader>

        {userData && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg border p-4 space-y-3 bg-amber-50">
              <p className="text-sm text-amber-900">
                Please review the details below. If this is not your account, contact support.
              </p>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Full Name:</span>
                  <p className="text-gray-900">{userData.fullName}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">KADIRS ID:</span>
                  <p className="text-gray-900 font-mono">{userData.kadirs_id || userData.tpui}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">TIN:</span>
                  <p className="text-gray-900 font-mono">{userData.tin}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">NIN:</span>
                  <p className="text-gray-900">{userData.nin}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Phone:</span>
                  <p className="text-gray-900">{userData.phone}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Email:</span>
                  <p className="text-gray-900">{userData.email}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading} className="bg-amber-600 hover:bg-amber-700">
            {isLoading ? "Processing..." : "Use This Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
