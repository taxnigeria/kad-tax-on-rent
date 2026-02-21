"use client"

import { format } from "date-fns"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
    Bell,
    Clock,
    CheckCircle2,
    FileText,
    Trash2,
    XCircle,
    Target,
    Calendar,
    Megaphone,
    Type,
    AlignLeft,
    Loader2,
} from "lucide-react"
import { useState } from "react"
import { deleteBroadcast, cancelScheduledBroadcast } from "@/app/actions/notifications"
import { toast } from "sonner"

interface BroadcastDetailsSheetProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    broadcast: any | null
    onUpdate: () => void
}

export function BroadcastDetailsSheet({ open, onOpenChange, broadcast, onUpdate }: BroadcastDetailsSheetProps) {
    const [deleting, setDeleting] = useState(false)
    const [canceling, setCanceling] = useState(false)

    if (!broadcast) return null

    const now = new Date()
    const scheduledDate = new Date(broadcast.scheduled_for)
    const isScheduledFuture = broadcast.status === "active" && scheduledDate > now
    const isSent = broadcast.status === "active" && scheduledDate <= now
    const isDraft = broadcast.status === "draft"
    const isArchived = broadcast.status === "archived"

    const handleDelete = async () => {
        setDeleting(true)
        try {
            await deleteBroadcast(broadcast.id)
            toast.success("Broadcast deleted successfully")
            onOpenChange(false)
            onUpdate()
        } catch (error) {
            toast.error("Failed to delete broadcast")
        } finally {
            setDeleting(false)
        }
    }

    const handleCancel = async () => {
        setCanceling(true)
        try {
            await cancelScheduledBroadcast(broadcast.id)
            toast.success("Scheduled broadcast canceled")
            onOpenChange(false)
            onUpdate()
        } catch (error) {
            toast.error("Failed to cancel broadcast")
        } finally {
            setCanceling(false)
        }
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col h-full">
                <SheetHeader className="px-6 py-5 border-b bg-muted/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
                                <Megaphone className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <SheetTitle className="text-base font-bold">Broadcast Details</SheetTitle>
                                <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                                    ID: {broadcast.id?.slice(0, 8)}...
                                </p>
                            </div>
                        </div>
                        <div>
                            {isSent && (
                                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]">
                                    <CheckCircle2 className="w-3 h-3 mr-1" /> Sent
                                </Badge>
                            )}
                            {isScheduledFuture && (
                                <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">
                                    <Clock className="w-3 h-3 mr-1" /> Scheduled
                                </Badge>
                            )}
                            {isDraft && (
                                <Badge className="bg-slate-500/10 text-slate-600 border-slate-500/20 text-[10px]">
                                    <FileText className="w-3 h-3 mr-1" /> Draft
                                </Badge>
                            )}
                            {isArchived && (
                                <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px]">
                                    <XCircle className="w-3 h-3 mr-1" /> Canceled
                                </Badge>
                            )}
                        </div>
                    </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                    <div className="px-6 py-5 space-y-5">
                        {/* Title */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                <Type className="h-3.5 w-3.5" />
                                Title
                            </div>
                            <p className="text-sm font-semibold">{broadcast.title}</p>
                        </div>

                        <Separator />

                        {/* Body / Message */}
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                <AlignLeft className="h-3.5 w-3.5" />
                                Message
                            </div>
                            <div className="text-sm text-muted-foreground bg-muted/30 rounded-lg p-4 border border-muted/50 whitespace-pre-wrap leading-relaxed">
                                {broadcast.body}
                            </div>
                        </div>

                        <Separator />

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    <Bell className="h-3.5 w-3.5" />
                                    Type
                                </div>
                                <Badge variant="outline" className="text-xs font-mono capitalize">
                                    {broadcast.type || "general"}
                                </Badge>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    <Target className="h-3.5 w-3.5" />
                                    Target Audience
                                </div>
                                <Badge variant="outline" className="text-xs font-mono">
                                    {broadcast.target_type}
                                    {broadcast.target_value ? `: ${broadcast.target_value}` : ""}
                                </Badge>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    <Calendar className="h-3.5 w-3.5" />
                                    Created
                                </div>
                                <p className="text-sm font-medium">
                                    {format(new Date(broadcast.created_at), "MMM d, yyyy")}
                                    <span className="text-muted-foreground ml-1 text-xs">
                                        {format(new Date(broadcast.created_at), "h:mm a")}
                                    </span>
                                </p>
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                    <Clock className="h-3.5 w-3.5" />
                                    {isScheduledFuture ? "Scheduled For" : "Sent At"}
                                </div>
                                <p className="text-sm font-medium">
                                    {format(new Date(broadcast.scheduled_for), "MMM d, yyyy")}
                                    <span className="text-muted-foreground ml-1 text-xs">
                                        {format(new Date(broadcast.scheduled_for), "h:mm a")}
                                    </span>
                                </p>
                            </div>

                            {broadcast.expires_at && (
                                <div className="space-y-1.5 col-span-2">
                                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        <Calendar className="h-3.5 w-3.5" />
                                        Expires
                                    </div>
                                    <p className="text-sm font-medium">
                                        {format(new Date(broadcast.expires_at), "MMM d, yyyy h:mm a")}
                                    </p>
                                </div>
                            )}
                        </div>

                        {broadcast.payload && Object.keys(broadcast.payload).length > 0 && (
                            <>
                                <Separator />
                                <div className="space-y-1.5">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Payload Data
                                    </div>
                                    <pre className="text-xs bg-muted/30 rounded-lg p-4 border border-muted/50 overflow-x-auto font-mono">
                                        {JSON.stringify(broadcast.payload, null, 2)}
                                    </pre>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="border-t bg-muted/5 p-4">
                    <div className="flex items-center gap-2">
                        {isScheduledFuture && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="outline" className="flex-1 text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700" disabled={canceling}>
                                        {canceling ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                                        Cancel Schedule
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Cancel Scheduled Broadcast?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will cancel the scheduled broadcast <span className="font-semibold text-foreground">"{broadcast.title}"</span>.
                                            It will be archived and won't be sent to users.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Keep Scheduled</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleCancel} className="bg-amber-600 hover:bg-amber-700">
                                            Cancel Broadcast
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}

                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="outline" className={`${isScheduledFuture ? '' : 'flex-1'} text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700`} disabled={deleting}>
                                    {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                    Delete
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Broadcast?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This will permanently delete <span className="font-semibold text-foreground">"{broadcast.title}"</span> and
                                        all associated read records. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                                        Delete Permanently
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )
}
