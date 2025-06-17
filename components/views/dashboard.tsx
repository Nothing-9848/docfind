"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { FileText, Upload, Tags, TrendingUp, Clock, Eye, FolderOpen, Zap, BarChart3 } from "lucide-react"
import type { AppState } from "../../types"

interface DashboardProps {
  state: AppState
}

export function Dashboard({ state }: DashboardProps) {
  const totalDocuments = state.documents.length
  const totalFolders = state.folders.length - 1 // Exclude root
  const totalTags = state.tags.length
  const watchedFolders = state.folders.filter((f) => f.isWatched).length
  const processingDocuments = state.documents.filter((d) => d.isProcessing).length

  const recentDocuments = state.documents.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5)

  const storageUsed = state.documents.reduce((total, doc) => total + doc.size, 0)
  const storageUsedMB = (storageUsed / (1024 * 1024)).toFixed(1)

  const stats = [
    {
      title: "Total Documents",
      value: totalDocuments,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      change: "+12%",
      changeType: "positive",
    },
    {
      title: "Active Folders",
      value: totalFolders,
      icon: FolderOpen,
      color: "text-green-600",
      bgColor: "bg-green-100",
      change: "+3",
      changeType: "positive",
    },
    {
      title: "Tags Created",
      value: totalTags,
      icon: Tags,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
      change: "+8%",
      changeType: "positive",
    },
    {
      title: "Storage Used",
      value: `${storageUsedMB} MB`,
      icon: BarChart3,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      change: "+2.1 MB",
      changeType: "neutral",
    },
  ]

  const quickActions = [
    {
      title: "Upload Documents",
      description: "Add new documents with OCR processing",
      icon: Upload,
      color: "bg-blue-500",
      action: () => console.log("Upload documents"),
    },
    {
      title: "Create Folder",
      description: "Organize documents in folders",
      icon: FolderOpen,
      color: "bg-green-500",
      action: () => console.log("Create folder"),
    },
    {
      title: "Watch Folder",
      description: "Auto-import from system folders",
      icon: Eye,
      color: "bg-purple-500",
      action: () => console.log("Watch folder"),
    },
    {
      title: "Bulk Process",
      description: "Process multiple documents at once",
      icon: Zap,
      color: "bg-orange-500",
      action: () => console.log("Bulk process"),
    },
  ]

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's an overview of your document management system.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                    <p
                      className={`text-xs ${
                        stat.changeType === "positive"
                          ? "text-green-600"
                          : stat.changeType === "negative"
                            ? "text-red-600"
                            : "text-gray-500"
                      }`}
                    >
                      {stat.change} from last month
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Documents */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Documents
                </CardTitle>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{doc.name}</h3>
                          <p className="text-sm text-gray-500">
                            {doc.createdAt.toLocaleDateString()} • {(doc.size / 1024).toFixed(0)} KB
                          </p>
                          {doc.isProcessing && (
                            <div className="mt-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-blue-600">Processing OCR...</span>
                                <Progress value={doc.processingProgress} className="w-20 h-1" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {doc.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {doc.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{doc.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  {recentDocuments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No documents yet. Upload your first document to get started!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full justify-start h-auto p-4"
                      onClick={action.action}
                    >
                      <div className={`w-8 h-8 ${action.color} rounded-lg flex items-center justify-center mr-3`}>
                        <action.icon className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium">{action.title}</p>
                        <p className="text-xs text-gray-500">{action.description}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Status */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">OCR Processing</span>
                    <Badge variant={processingDocuments > 0 ? "default" : "secondary"}>
                      {processingDocuments > 0 ? `${processingDocuments} active` : "Idle"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Watched Folders</span>
                    <Badge variant="secondary">{watchedFolders} active</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Storage Usage</span>
                    <Badge variant="outline">{storageUsedMB} MB</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
