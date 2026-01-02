"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ProfileCompletionSection } from "@/components/profile-completion-section"

interface ProfileCompletionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProfileCompletionModal({ open, onOpenChange }: ProfileCompletionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Complete Your Profile</DialogTitle>
          <DialogDescription>
            Before registering a property, please complete the following steps to verify your account.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <ProfileCompletionSection />
        </div>
      </DialogContent>
    </Dialog>
  )
}
