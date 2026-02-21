"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Send, Save, Calendar, Plus, Link2 } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { sendBroadcastNotification } from "@/app/actions/notifications"

const formSchema = z.object({
    title: z.string().min(2, { message: "Title must be at least 2 characters." }),
    body: z.string().min(10, { message: "Message must be at least 10 characters." }),
    type: z.string().default("system"),
    targetType: z.enum(["ALL", "ROLE", "LGA", "PROPERTY", "USER"]),
    targetValue: z.string().optional(),
    scheduledFor: z.string().optional(), // ISO string from datetime-local input
    actionLink: z.string().optional(), // URL to navigate when notification is clicked
})

export function NotificationSender({ onSent }: { onSent?: () => void } = {}) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            body: "",
            type: "system",
            targetType: "ALL",
            targetValue: "",
            scheduledFor: "",
            actionLink: "",
        },
    })

    const targetType = form.watch("targetType")

    async function onSubmit(values: z.infer<typeof formSchema>, status: 'active' | 'draft' = 'active') {
        setLoading(true)
        try {
            if (values.targetType !== "ALL" && !values.targetValue) {
                form.setError("targetValue", { message: "Target value is required." })
                setLoading(false)
                return
            }

            // Logic: If active and scheduledFor is future, it's effectively "Scheduled".
            // If status is draft, it's a draft regardless of date.

            await sendBroadcastNotification({
                title: values.title,
                body: values.body,
                type: values.type,
                targetType: values.targetType,
                targetValue: values.targetValue,
                scheduledFor: values.scheduledFor || undefined,
                payload: values.actionLink ? { url: values.actionLink } : undefined,
                status: status
            })

            toast.success(status === 'draft' ? "Draft saved" : "Broadcast sent/scheduled")
            form.reset()
            setOpen(false)
            onSent?.()
        } catch (error) {
            console.error(error)
            toast.error("Failed to process notification")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Broadcast
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Send Broadcast Notification</DialogTitle>
                    <DialogDescription>
                        Create a new notification to send immediately, schedule for later, or save as draft.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Title</FormLabel>
                                        <FormControl>
                                            <Input placeholder="System Maintenance" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Type</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="system">System Alert</SelectItem>
                                                <SelectItem value="info">Information</SelectItem>
                                                <SelectItem value="warning">Warning</SelectItem>
                                                <SelectItem value="success">Success</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="targetType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Target Audience</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select target" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="ALL">All Users</SelectItem>
                                                <SelectItem value="ROLE">Specific Role</SelectItem>
                                                <SelectItem value="LGA">Specific LGA</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {targetType === "ROLE" && (
                                <FormField
                                    control={form.control}
                                    name="targetValue"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Role</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select role" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="taxpayer">Taxpayer</SelectItem>
                                                    <SelectItem value="property_manager">Property Manager</SelectItem>
                                                    <SelectItem value="area_manager">Area Manager</SelectItem>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                            {targetType === "LGA" && (
                                <FormField
                                    control={form.control}
                                    name="targetValue"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>LGA ID</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter LGA ID" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="scheduledFor"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Schedule For (Optional)</FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" {...field} />
                                        </FormControl>
                                        <FormDescription>Leave blank to send immediately.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="body"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Message Body</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Type your message here..." className="min-h-[100px]" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="actionLink"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-1.5">
                                        <Link2 className="h-3.5 w-3.5" />
                                        Action Link (Optional)
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="/taxpayer-dashboard/invoices" {...field} />
                                    </FormControl>
                                    <FormDescription>When users click the notification, they'll be taken to this page.</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-between pt-4">
                            <Button type="button" variant="outline" onClick={form.handleSubmit((d) => onSubmit(d, 'draft'))} disabled={loading}>
                                <Save className="mr-2 h-4 w-4" />
                                Save Draft
                            </Button>

                            <Button type="button" onClick={form.handleSubmit((d) => onSubmit(d, 'active'))} disabled={loading}>
                                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                {form.watch('scheduledFor') ? 'Schedule Broadcast' : 'Send Immediately'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
