"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, FolderOpen, Tags, Clock, Upload, Search, Eye, BarChart3, Activity, Database } from "lucide-react"
import type { AppState } from "../../types"

interface DashboardProps {
  state: AppState
  updateState: (updates: Partial<AppState>) => void
}

export function EnhancedDashboard({ state, updateState }: DashboardProps) {
  const recentDocuments = state.documents.slice(0, 5)
  const totalSize = state.documents.reduce((acc, doc) => acc + doc.size, 0)
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const stats = [
    {
      title: "Total Documents",
      value: state.documents.length,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      change: "+12%",
      changeColor: "text-green-600",
    },
    {
      title: "Active Folders",
      value: state.folders.length - 1,
      icon: FolderOpen,
      color: "text-green-600",
      bgColor: "bg-green-50",
      change: "+3",
      changeColor: "text-green-600",
    },
    {
      title: "Total Tags",
      value: state.tags.length,
      icon: Tags,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      change: "+8",
      changeColor: "text-green-600",
    },
    {
      title: "Storage Used",
      value: formatBytes(totalSize),
      icon: Database,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      change: "+2.1MB",
      changeColor: "text-blue-600",
    },
  ]

  const quickActions = [
    {
      title: "Upload Documents",
      description: "Add new documents to your library",
      icon: Upload,
      action: () => updateState({ currentView: "documents" }),
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      title: "Advanced Search",
      description: "Find documents with powerful filters",
      icon: Search,
      action: () => updateState({ currentView: "search" }),
      color: "bg-green-600 hover:bg-green-700",
    },
    {
      title: "Manage Folders",
      description: "Organize your document structure",
      icon: FolderOpen,
      action: () => updateState({ currentView: "folders" }),
      color: "bg-purple-600 hover:bg-purple-700",
    },
    {
      title: "View Analytics",
      description: "See usage statistics and insights",
      icon: BarChart3,
      action: () => updateState({ currentView: "settings" }),
      color: "bg-orange-600 hover:bg-orange-700",
    },
  ]

  return (
    <ScrollArea className="h-full">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your documents.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <div className="flex items-center mt-2">
                      <span className={`text-sm font-medium ${stat.changeColor}`}>{stat.change}</span>
                      <span className="text-sm text-gray-500 ml-1">from last month</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      onClick={action.action}
                      className={`h-auto p-4 flex-col items-start text-left ${action.color} text-white`}
                    >
                      <action.icon className="h-6 w-6 mb-2" />
                      <span className="font-semibold mb-1">{action.title}</span>
                      <span className="text-xs opacity-90">{action.description}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                          <FileText className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{doc.name}</p>
                          <p className="text-sm text-gray-500">
                            {doc.type.toUpperCase()} • {formatBytes(doc.size)} • {doc.createdAt.toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {recentDocuments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No documents yet. Upload your first document to get started!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-6">
            {/* Storage Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Storage Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Used</span>
                    <span>{formatBytes(totalSize)}</span>
                  </div>
                  <Progress value={Math.min((totalSize / (100 * 1024 * 1024)) * 100, 100)} className="h-2" />
                  <p className="text-xs text-gray-500">
                    Storage location: {state.settings?.storageLocation || "browser"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Popular Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Popular Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {state.tags.slice(0, 6).map((tag) => (
                    <div key={tag.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-${tag.color}-500`} />
                        <span className="text-sm font-medium">{tag.name}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {tag.documentCount}
                      </Badge>
                    </div>
                  ))}
                  {state.tags.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No tags created yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">System Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">OCR Service</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Database</span>
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Connected
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Auto Backup</span>
                    <Badge
                      variant={state.settings?.autoBackup ? "default" : "secondary"}
                      className={state.settings?.autoBackup ? "bg-green-100 text-green-800" : ""}
                    >
                      {state.settings?.autoBackup ? "Enabled" : "Disabled"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Languages</span>
                    <Badge variant="secondary">{state.settings?.ocrLanguages?.length || 0} enabled</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
