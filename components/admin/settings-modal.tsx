"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogClose
} from "@/components/ui/dialog"
import {
	Settings,
	Monitor,
	ShieldCheck,
	Palette,
	Globe,
	Lock,
	X,
	Save,
	Loader2,
	AlertTriangle,
	Info,
	Smartphone,
	Check
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
	getSystemSettings,
	bulkUpdateSettings,
	ensureDefaultSettings,
	type SystemSetting,
	type SettingsCategory
} from "@/app/actions/settings"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface AdminSettingsModalProps {
	open: boolean
	onOpenChange: (open: boolean) => void
}

type TabType = "general" | "ai_features" | "system" | "security" | "branding" | "regional"

export function AdminSettingsModal({ open, onOpenChange }: AdminSettingsModalProps) {
	const { user, userRole } = useAuth()
	const [activeTab, setActiveTab] = useState<TabType>("general")
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [allSettings, setAllSettings] = useState<SystemSetting[]>([])

	const isSuperAdmin = userRole === "super_admin"

	useEffect(() => {
		if (open) {
			loadSettings()
		}
	}, [open])

	async function loadSettings() {
		try {
			setLoading(true)
			if (user?.uid) {
				await ensureDefaultSettings(user.uid)
			}
			const data = await getSystemSettings()
			setAllSettings(data)
		} catch (error) {
			console.error("Failed to load settings:", error)
			toast.error("Failed to load settings")
		} finally {
			setLoading(false)
		}
	}

	const getSettingsByCategory = (category: string) => {
		return allSettings.filter(s => s.category === category)
	}

	const handleUpdateSetting = (id: string, value: any) => {
		setAllSettings(prev => prev.map(s => s.id === id ? { ...s, setting_value: value } : s))
	}

	const handleSave = async () => {
		if (!user?.uid) return

		try {
			setSaving(true)
			const updates = allSettings.map(s => ({
				id: s.id,
				setting_value: s.setting_value
			}))

			await bulkUpdateSettings(updates, user.uid)
			toast.success("Settings updated successfully")
		} catch (error) {
			console.error("Error saving settings:", error)
			toast.error("Failed to save settings")
		} finally {
			setSaving(false)
		}
	}

	const SidebarItem = ({ id, label, icon: Icon }: { id: TabType, label: string, icon: any }) => (
		<button
			onClick={() => setActiveTab(id)}
			className={cn(
				"flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
				activeTab === id
					? "bg-primary/10 text-primary"
					: "text-muted-foreground hover:bg-muted hover:text-foreground"
			)}
		>
			<Icon className="h-4 w-4" />
			{label}
		</button>
	)

	const SettingRow = ({
		title,
		description,
		children,
		restricted = false
	}: {
		title: string,
		description?: string,
		children: React.ReactNode,
		restricted?: boolean
	}) => {
		if (restricted && !isSuperAdmin) return null

		return (
			<div className="flex flex-col gap-4 py-6 md:flex-row md:items-start md:justify-between">
				<div className="space-y-1 flex-1">
					<div className="flex items-center gap-2">
						<Label className="text-sm font-semibold sm:text-base">{title}</Label>
						{restricted && (
							<Badge variant="outline" className="text-[10px] h-4 bg-amber-500/10 text-amber-600 border-amber-500/20">
								Super Admin
							</Badge>
						)}
					</div>
					{description && <p className="text-xs text-muted-foreground leading-relaxed md:max-w-[500px] sm:text-sm">{description}</p>}
				</div>
				<div className="flex items-center gap-4 w-full md:w-auto md:shrink-0 md:justify-end">
					{children}
				</div>
			</div>
		)
	}

	// Find setting helper
	const findSetting = (category: string, key: string) => {
		return allSettings.find(s => s.category === category && s.setting_key === key)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-[1000px] sm:max-w-[1000px] p-0 overflow-hidden h-[85vh] max-h-[800px] group" showCloseButton={true}>
				<div className="flex h-full flex-col md:flex-row">
					{/* Sidebar */}
					<div className="w-full border-b bg-muted/30 p-4 md:w-52 md:border-b-0 md:border-r">
						<div className="flex items-center gap-2 px-2 py-4 mb-4">
							<div className="rounded-lg bg-primary p-1">
								<Settings className="h-5 w-5 text-primary-foreground" />
							</div>
							<span className="font-bold text-lg tracking-tight">Settings</span>
						</div>

						{/* Mobile Nav */}
						<div className="flex overflow-x-auto pb-2 gap-2 md:hidden">
							{["general", "ai_features", "system", "security", "branding", "regional"].map((tab) => (
								<Button
									key={tab}
									variant={activeTab === tab ? "default" : "secondary"}
									size="sm"
									onClick={() => setActiveTab(tab as TabType)}
									className="shrink-0 capitalize"
								>
									{tab === "ai_features" ? "AI Features" : tab}
								</Button>
							))}
						</div>

						{/* Desktop Nav */}
						<nav className="hidden md:flex flex-col gap-1">
							<SidebarItem id="general" label="General" icon={Settings} />
							<SidebarItem id="ai_features" label="AI Features" icon={Smartphone} />
							<SidebarItem id="system" label="System Control" icon={Monitor} />
							<SidebarItem id="security" label="Permissions" icon={Lock} />
							<SidebarItem id="branding" label="Branding" icon={Palette} />
							<SidebarItem id="regional" label="Regional" icon={Globe} />
						</nav>
					</div>

					{/* Content Area */}
					<div className="relative flex flex-1 flex-col overflow-hidden bg-background">
						<div className="flex items-center justify-between border-b px-6 py-4">
							<div className="space-y-0.5">
								<DialogHeader className="p-0 space-y-0.5 text-left">
									<DialogTitle className="text-xl font-bold capitalize">
										{activeTab} Settings
									</DialogTitle>
									<DialogDescription className="text-xs text-muted-foreground">
										Manage your application preferences and controls.
									</DialogDescription>
								</DialogHeader>
							</div>
							<DialogClose asChild>
								<Button variant="ghost" size="icon" className="md:hidden">
									<X className="h-4 w-4" />
								</Button>
							</DialogClose>
						</div>

						<ScrollArea className="flex-1 px-6">
							<div className="py-6 space-y-6">

								{activeTab === "general" && (
									<div className="divide-y">
										<SettingRow
											title="Organization Name"
											description="Default name used across the portal and notifications."
										>
											{(() => {
												const s = findSetting("general", "app_name")
												return s ? (
													<Input
														className="max-w-[250px]"
														value={s.setting_value ?? ""}
														onChange={(e) => handleUpdateSetting(s.id, e.target.value)}
													/>
												) : <Skeleton className="h-9 w-[250px]" />
											})()}
										</SettingRow>

										<SettingRow
											title="Support Email"
											description="Primary contact email for help and system notifications."
										>
											{(() => {
												const s = findSetting("general", "support_email")
												return s ? (
													<Input
														className="w-full md:max-w-[350px]"
														value={s.setting_value ?? ""}
														onChange={(e) => handleUpdateSetting(s.id, e.target.value)}
													/>
												) : <Skeleton className="h-9 w-[250px]" />
											})()}
										</SettingRow>

										<SettingRow
											title="Support Phone"
											description="Help line displayed to taxpayers."
										>
											{(() => {
												const s = findSetting("general", "support_phone")
												return s ? (
													<Input
														className="w-full md:max-w-[350px]"
														value={s.setting_value ?? ""}
														onChange={(e) => handleUpdateSetting(s.id, e.target.value)}
													/>
												) : <Skeleton className="h-9 w-[250px]" />
											})()}
										</SettingRow>
									</div>
								)}

								{activeTab === "ai_features" && (
									<div className="divide-y">
										<SettingRow
											title="AI Assistant"
											description="Enable intelligent chat assistant for taxpayers and staff."
										>
											{(() => {
												const s = findSetting("ai_features", "ai_assistant_enabled")
												return s ? (
													<Switch
														checked={s.setting_value === true}
														onCheckedChange={(val) => handleUpdateSetting(s.id, val)}
													/>
												) : <span>Setting not found</span>
											})()}
										</SettingRow>

										<SettingRow
											title="AI Document Analysis"
											description="Automatically analyze uploaded property documents and extract key information."
										>
											{(() => {
												const s = findSetting("ai_features", "ai_document_analysis")
												return s ? (
													<Switch
														checked={s.setting_value === true}
														onCheckedChange={(val) => handleUpdateSetting(s.id, val)}
													/>
												) : <span>Setting not found</span>
											})()}
										</SettingRow>

										<SettingRow
											title="AI Tax Recommendations"
											description="Provide smart tax optimization suggestions based on property data."
										>
											{(() => {
												const s = findSetting("ai_features", "ai_tax_recommendations")
												return s ? (
													<Switch
														checked={s.setting_value === true}
														onCheckedChange={(val) => handleUpdateSetting(s.id, val)}
													/>
												) : <span>Setting not found</span>
											})()}
										</SettingRow>
									</div>
								)}

								{activeTab === "system" && (
									<div className="divide-y">
										<div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4 flex gap-4">
											<AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
											<div className="space-y-1">
												<p className="text-sm font-semibold text-amber-700">System Overrides</p>
												<p className="text-xs text-amber-600/80">These settings affect all users globally. Use with caution during office hours.</p>
											</div>
										</div>

										<SettingRow
											title="Maintenance Mode"
											description="When active, only Super Admins can access the portal. Public users see a maintenance screen."
											restricted={true}
										>
											{(() => {
												const s = findSetting("system", "maintenance_mode")
												return s ? (
													<Switch
														checked={s.setting_value === true}
														onCheckedChange={(val) => handleUpdateSetting(s.id, val)}
													/>
												) : <span>Setting not found</span>
											})()}
										</SettingRow>

										<SettingRow
											title="Test Mode (Sandbox)"
											description="Enables test mode for payment gateways and tags all new records as 'TEST'."
											restricted={true}
										>
											{(() => {
												const s = findSetting("system", "test_mode")
												return s ? (
													<Switch
														checked={s.setting_value === true}
														onCheckedChange={(val) => handleUpdateSetting(s.id, val)}
													/>
												) : <span>Setting not found</span>
											})()}
										</SettingRow>

										<SettingRow
											title="Maintenance Message"
											description="Custom message displayed when portal is in maintenance."
										>
											{(() => {
												const s = findSetting("system", "maintenance_message")
												return s ? (
													<Input
														className="w-full md:max-w-[350px]"
														placeholder="We will be back soon..."
														value={s.setting_value ?? ""}
														onChange={(e) => handleUpdateSetting(s.id, e.target.value)}
													/>
												) : <Skeleton className="h-9 w-[250px]" />
											})()}
										</SettingRow>

										<SettingRow
											title="PayKaduna API Mode"
											description="Controls which PayKaduna environment is used for bill creation, KADIRS registration, and all payment API calls."
										>
											{(() => {
												const s = findSetting("system", "paykaduna_mode")
												return s ? (
													<div className="flex items-center gap-3">
														<select
															className="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
															value={s.setting_value}
															onChange={(e) => handleUpdateSetting(s.id, e.target.value)}
														>
															<option value="test">Test (Sandbox)</option>
															<option value="live">Live (Production)</option>
														</select>
														<Badge
															variant="outline"
															className={cn(
																"text-[10px] h-5",
																s.setting_value === "live"
																	? "bg-red-500/10 text-red-600 border-red-500/20"
																	: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
															)}
														>
															{s.setting_value === "live" ? "⚠ LIVE" : "✓ TEST"}
														</Badge>
													</div>
												) : <span>Setting not found</span>
											})()}
										</SettingRow>
									</div>
								)}

								{activeTab === "security" && (
									<div className="divide-y">
										<SettingRow
											title="Enable Admin Login"
											description="Toggle if basic Admins can sign into the portal."
											restricted={true}
										>
											{(() => {
												const s = findSetting("security", "login_enabled_admin")
												return s ? (
													<Switch
														checked={s.setting_value === true}
														onCheckedChange={(val) => handleUpdateSetting(s.id, val)}
													/>
												) : <span>Setting not found</span>
											})()}
										</SettingRow>

										<SettingRow
											title="Enable Staff Login"
											description="Toggle if field officers and staff can sign into the portal."
											restricted={true}
										>
											{(() => {
												const s = findSetting("security", "login_enabled_staff")
												return s ? (
													<Switch
														checked={s.setting_value === true}
														onCheckedChange={(val) => handleUpdateSetting(s.id, val)}
													/>
												) : <span>Setting not found</span>
											})()}
										</SettingRow>

										<SettingRow
											title="Enable Taxpayer Login"
											description="Toggle if the public portal is accessible for taxpayers."
											restricted={true}
										>
											{(() => {
												const s = findSetting("security", "login_enabled_taxpayer")
												return s ? (
													<Switch
														checked={s.setting_value === true}
														onCheckedChange={(val) => handleUpdateSetting(s.id, val)}
													/>
												) : <span>Setting not found</span>
											})()}
										</SettingRow>
									</div>
								)}

								{activeTab === "branding" && (
									<div className="divide-y">
										<SettingRow
											title="App Logo"
											description="URL or path to the primary logo used in the sidebar and emails."
										>
											{(() => {
												const s = findSetting("general", "app_logo_url")
												return s ? (
													<Input
														className="w-full md:max-w-[350px]"
														value={s.setting_value ?? ""}
														onChange={(e) => handleUpdateSetting(s.id, e.target.value)}
													/>
												) : <Skeleton className="h-9 w-[250px]" />
											})()}
										</SettingRow>

										<SettingRow
											title="Primary Brand Color"
											description="Accent color used for buttons, links, and active states."
										>
											{(() => {
												const s = findSetting("branding", "primary_color")
												return s ? (
													<div className="flex gap-2">
														<Input
															type="color"
															className="w-12 h-9 p-1 cursor-pointer"
															value={s.setting_value ?? "#000000"}
															onChange={(e) => handleUpdateSetting(s.id, e.target.value)}
														/>
														<Input
															className="w-24 h-9 font-mono text-xs"
															value={s.setting_value ?? ""}
															onChange={(e) => handleUpdateSetting(s.id, e.target.value)}
														/>
													</div>
												) : <Skeleton className="h-9 w-[250px]" />
											})()}
										</SettingRow>
									</div>
								)}

								{activeTab === "regional" && (
									<div className="divide-y">
										<SettingRow
											title="Current State"
											description="The name of the state governing the portal (e.g. Kaduna)."
										>
											{(() => {
												const s = findSetting("regional", "state_name")
												return s ? (
													<Input
														className="w-full md:max-w-[350px]"
														value={s.setting_value ?? ""}
														onChange={(e) => handleUpdateSetting(s.id, e.target.value)}
													/>
												) : <Skeleton className="h-9 w-[250px]" />
											})()}
										</SettingRow>

										<SettingRow
											title="Tax Authority"
											description="Official name of the tax authority (e.g. KADIRS)."
										>
											{(() => {
												const s = findSetting("regional", "tax_authority_name")
												return s ? (
													<Input
														className="w-full md:max-w-[350px]"
														value={s.setting_value ?? ""}
														onChange={(e) => handleUpdateSetting(s.id, e.target.value)}
													/>
												) : <Skeleton className="h-9 w-[250px]" />
											})()}
										</SettingRow>
									</div>
								)}

							</div>
						</ScrollArea>

						<div className="flex items-center justify-end gap-3 border-t bg-muted/30 px-6 py-4">
							<p className="hidden text-[11px] text-muted-foreground md:block">
								All changes are logged in the system activity trail.
							</p>
							<div className="flex gap-2">
								<Button variant="outline" size="sm" onClick={() => onOpenChange(false)} disabled={saving}>
									Cancel
								</Button>
								<Button size="sm" onClick={handleSave} disabled={saving || loading}>
									{saving ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Saving...
										</>
									) : (
										<>
											<Save className="mr-2 h-4 w-4" />
											Save Changes
										</>
									)}
								</Button>
							</div>
						</div>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}
