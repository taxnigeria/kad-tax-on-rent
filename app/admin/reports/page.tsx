"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Download, Mail, RefreshCw, TrendingUp, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AddReportTemplateModal } from "@/components/admin/add-report-template-modal"

// Sample data for different report types
const taxSummaryData = [
  { month: "Jan", collected: 4000, pending: 2400, overdue: 800 },
  { month: "Feb", collected: 3000, pending: 1398, overdue: 600 },
  { month: "Mar", collected: 2000, pending: 9800, overdue: 1200 },
  { month: "Apr", collected: 2780, pending: 3908, overdue: 900 },
  { month: "May", collected: 1890, pending: 4800, overdue: 700 },
  { month: "Jun", collected: 2390, pending: 3800, overdue: 500 },
]

const propertyData = [
  { name: "Residential", value: 450 },
  { name: "Commercial", value: 320 },
  { name: "Industrial", value: 180 },
  { name: "Agricultural", value: 50 },
]

const paymentAnalyticsData = [
  { week: "W1", completed: 2400, pending: 1200, failed: 200 },
  { week: "W2", completed: 1398, pending: 2210, failed: 150 },
  { week: "W3", completed: 9800, pending: 2290, failed: 300 },
  { week: "W4", completed: 3908, pending: 1908, failed: 100 },
]

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#3b82f6"]

const REPORT_TEMPLATES = [
  {
    id: "tax_summary",
    name: "Tax Collection Summary",
    description: "Overview of collected, pending, and overdue taxes",
    icon: "TrendingUp",
    metrics: ["Total Collected: ₦12.5M", "Pending: ₦5.2M", "Overdue: ₦1.8M"],
  },
  {
    id: "property_inventory",
    name: "Property Inventory Report",
    description: "Distribution of properties by type and location",
    icon: "FileText",
    metrics: ["Total Properties: 1000", "Active: 950", "Inactive: 50"],
  },
  {
    id: "payment_analytics",
    name: "Payment Analytics",
    description: "Payment trends and completion rates",
    icon: "TrendingUp",
    metrics: ["Completion Rate: 87%", "Avg Processing: 2.3 days", "Success Rate: 98.5%"],
  },
  {
    id: "enumerator_performance",
    name: "Enumerator Performance",
    description: "Metrics on enumeration activities and compliance",
    icon: "FileText",
    metrics: ["Total Enumerators: 24", "Active: 22", "Properties Surveyed: 856"],
  },
]

export default function ReportsPage() {
  const router = useRouter()
  const { user, userRole, loading: authLoading } = useAuth()
  const [selectedReport, setSelectedReport] = useState("tax_summary")
  const [dateRange, setDateRange] = useState("month")
  const [exportFormat, setExportFormat] = useState("pdf")
  const [isExporting, setIsExporting] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login")
      } else if (userRole && !["admin", "super_admin", "staff"].includes(userRole)) {
        router.push("/taxpayer-dashboard")
      }
    }
  }, [user, userRole, authLoading, router])

  const handleGenerateReport = async () => {
    setIsExporting(true)
    try {
      // Simulate export process
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast({
        title: "Success",
        description: `Report exported as ${exportFormat.toUpperCase()}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  const handleScheduleEmail = () => {
    toast({
      title: "Email Scheduled",
      description: "Report will be sent to admin@kadtaxonrent.ng weekly",
    })
  }

  const currentTemplate = REPORT_TEMPLATES.find((t) => t.id === selectedReport)

  if (authLoading) {
    return null
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1">
          <div className="container mx-auto py-8 px-4 max-w-7xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold">Reports</h1>
                <p className="text-muted-foreground mt-2">Generate and export business intelligence reports</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Report Template
                </Button>
                <Button onClick={handleScheduleEmail} variant="outline" className="gap-2 bg-transparent">
                  <Mail className="h-4 w-4" />
                  Schedule Reports
                </Button>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-4">
              {/* Report Templates Sidebar */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Report Templates</CardTitle>
                    <CardDescription>Select a report to view</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {REPORT_TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => setSelectedReport(template.id)}
                        className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                          selectedReport === template.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-transparent bg-muted/50 hover:bg-muted"
                        }`}
                      >
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground mt-1">{template.description}</div>
                      </button>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3 space-y-6">
                {/* Report Info */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>{currentTemplate?.name}</CardTitle>
                        <CardDescription>{currentTemplate?.description}</CardDescription>
                      </div>
                      <TrendingUp className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                      {currentTemplate?.metrics.map((metric, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-sm font-medium">{metric}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Report Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="chart" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="chart">Chart</TabsTrigger>
                        <TabsTrigger value="data">Data</TabsTrigger>
                      </TabsList>

                      <TabsContent value="chart" className="space-y-4">
                        {selectedReport === "tax_summary" && (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={taxSummaryData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="collected" fill="#10b981" />
                              <Bar dataKey="pending" fill="#f59e0b" />
                              <Bar dataKey="overdue" fill="#ef4444" />
                            </BarChart>
                          </ResponsiveContainer>
                        )}

                        {selectedReport === "property_inventory" && (
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={propertyData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value }) => `${name}: ${value}`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {propertyData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        )}

                        {selectedReport === "payment_analytics" && (
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={paymentAnalyticsData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="week" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Line type="monotone" dataKey="completed" stroke="#10b981" />
                              <Line type="monotone" dataKey="pending" stroke="#f59e0b" />
                              <Line type="monotone" dataKey="failed" stroke="#ef4444" />
                            </LineChart>
                          </ResponsiveContainer>
                        )}

                        {selectedReport === "enumerator_performance" && (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={taxSummaryData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="month" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="collected" fill="#3b82f6" />
                              <Bar dataKey="pending" fill="#6366f1" />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </TabsContent>

                      <TabsContent value="data" className="space-y-4">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-2 px-3">Period</th>
                                <th className="text-left py-2 px-3">Value 1</th>
                                <th className="text-left py-2 px-3">Value 2</th>
                                <th className="text-left py-2 px-3">Value 3</th>
                              </tr>
                            </thead>
                            <tbody>
                              {taxSummaryData.map((row, index) => (
                                <tr key={index} className="border-b hover:bg-muted/50">
                                  <td className="py-2 px-3">{row.month}</td>
                                  <td className="py-2 px-3">₦{(row.collected / 1000).toFixed(1)}K</td>
                                  <td className="py-2 px-3">₦{(row.pending / 1000).toFixed(1)}K</td>
                                  <td className="py-2 px-3">₦{(row.overdue / 1000).toFixed(1)}K</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Filters & Export */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Export Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Filters */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="dateRange">Date Range</Label>
                        <Select value={dateRange} onValueChange={setDateRange}>
                          <SelectTrigger id="dateRange">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="week">Last 7 Days</SelectItem>
                            <SelectItem value="month">Last 30 Days</SelectItem>
                            <SelectItem value="quarter">Last Quarter</SelectItem>
                            <SelectItem value="year">Last Year</SelectItem>
                            <SelectItem value="custom">Custom Range</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="exportFormat">Export Format</Label>
                        <Select value={exportFormat} onValueChange={setExportFormat}>
                          <SelectTrigger id="exportFormat">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pdf">PDF Document</SelectItem>
                            <SelectItem value="csv">CSV File</SelectItem>
                            <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="space-y-3 pt-4 border-t">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox defaultChecked />
                        <span className="text-sm">Include charts and visualizations</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox defaultChecked />
                        <span className="text-sm">Add summary metrics</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox />
                        <span className="text-sm">Add company branding</span>
                      </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                      <Button onClick={handleGenerateReport} disabled={isExporting} className="gap-2 flex-1">
                        {isExporting ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Export as {exportFormat.toUpperCase()}
                          </>
                        )}
                      </Button>
                      <Button onClick={handleScheduleEmail} variant="outline" className="gap-2 bg-transparent">
                        <Mail className="h-4 w-4" />
                        Email
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </main>

        <AddReportTemplateModal open={isAddModalOpen} onOpenChange={setIsAddModalOpen} onSuccess={() => {}} />
      </SidebarInset>
    </SidebarProvider>
  )
}
