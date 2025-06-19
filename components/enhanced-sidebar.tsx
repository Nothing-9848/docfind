"use client"

import { useState } from "react"
import {
  Home,
  FileText,
  FolderOpen,
  Tags,
  Search,
  Settings,
  Upload,
  Eye,
  Plus,
  ChevronRight,
  ChevronDown,
  Briefcase,
  DollarSign,
  Archive,
  Folder,
  Database,
  Languages,
  HardDrive,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import type { AppState } from "../types"

interface EnhancedSidebarProps {
  state: AppState
  updateState: (updates: Partial<AppState>) => void
}

export function Sidebar({ state, updateState }: EnhancedSidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root"]))
  const [searchTerm, setSearchTerm] = useState("")

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, count: null },
    { id: "documents", label: "All Documents", icon: FileText, count: state.documents.length },
    { id: "folders", label: "Folders", icon: FolderOpen, count: state.folders.length - 1 },
    { id: "tags", label: "Tags", icon: Tags, count: state.tags.length },
    { id: "search", label: "Advanced Search", icon: Search, count: null },
  ]

  const systemItems = [
    { id: "settings", label: "Settings", icon: Settings },
    { id: "database", label: "Database", icon: Database },
    { id: "languages", label: "OCR Languages", icon: Languages },
    { id: "storage", label: "Storage", icon: HardDrive },
  ]

  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const getFolderIcon = (folder: any) => {
    const iconMap = {
      briefcase: Briefcase,
      "dollar-sign": DollarSign,
      archive: Archive,
      folder: Folder,
    }
    const IconComponent = iconMap[folder.icon as keyof typeof iconMap] || Folder
    return <IconComponent className="h-4 w-4" />
  }

  const renderFolder = (folder: any, level = 0) => {
    if (folder.id === "root") {
      return folder.children.map((childId: string) => {
        const childFolder = state.folders.find((f) => f.id === childId)
        return childFolder ? renderFolder(childFolder, level) : null
      })
    }

    const hasChildren = folder.children.length > 0
    const isExpanded = expandedFolders.has(folder.id)
    const documentCount = folder.documentIds.length

    return (
      <div key={folder.id} className="group">
        <Button
          variant={state.selectedFolder === folder.id ? "secondary" : "ghost"}
          className={`w-full justify-start text-left h-8 px-2 hover:bg-gray-100 transition-colors ${
            level > 0 ? `ml-${level * 4}` : ""
          } ${state.selectedFolder === folder.id ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600" : ""}`}
          onClick={() => {
            updateState({ selectedFolder: folder.id, currentView: "folders" })
          }}
        >
          <div className="flex items-center flex-1 min-w-0">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFolder(folder.id)
                }}
                className="mr-1 p-0.5 hover:bg-gray-200 rounded"
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
            )}
            {!hasChildren && <div className="w-4 mr-1" />}
            <div className="flex items-center min-w-0 flex-1">
              {getFolderIcon(folder)}
              <span className="ml-2 flex-1 truncate text-sm">{folder.name}</span>
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {folder.isWatched && <Eye className="h-3 w-3 text-blue-500" />}
              {documentCount > 0 && (
                <Badge variant="secondary" className="h-5 text-xs px-1.5">
                  {documentCount}
                </Badge>
              )}
            </div>
          </div>
        </Button>

        {isExpanded && hasChildren && (
          <div className="ml-2">
            {folder.children.map((childId: string) => {
              const childFolder = state.folders.find((f) => f.id === childId)
              return childFolder ? renderFolder(childFolder, level + 1) : null
            })}
          </div>
        )}
      </div>
    )
  }

  const filteredTags = state.tags.filter((tag) => tag.name.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">DocuFlow Pro</h1>
            <p className="text-sm text-gray-500">Smart Document Management</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-100">
        <Button
          className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
          onClick={() => updateState({ currentView: "documents" })}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Documents
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {/* Navigation */}
        <nav className="p-4">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant={state.currentView === item.id ? "secondary" : "ghost"}
                className={`w-full justify-start h-9 px-3 text-sm hover:bg-gray-100 transition-colors ${
                  state.currentView === item.id ? "bg-blue-50 text-blue-700 border-r-2 border-blue-600" : ""
                }`}
                onClick={() => updateState({ currentView: item.id as any })}
              >
                <item.icon className="mr-3 h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== null && (
                  <Badge variant="secondary" className="ml-auto h-5 text-xs px-1.5">
                    {item.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </nav>

        <Separator className="mx-4" />

        {/* Folders */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Folders</h3>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-gray-100"
              onClick={() => {
                // Add new folder logic
                console.log("Add new folder")
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-0.5">
            {state.folders.find((f) => f.id === "root") && renderFolder(state.folders.find((f) => f.id === "root")!)}
          </div>
        </div>

        <Separator className="mx-4" />

        {/* Tags */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Popular Tags</h3>
          <div className="mb-3">
            <Input
              placeholder="Search tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="space-y-1">
            {filteredTags.slice(0, 8).map((tag) => (
              <Button
                key={tag.id}
                variant="ghost"
                size="sm"
                className="w-full justify-start h-7 px-2 text-sm hover:bg-gray-100"
                onClick={() => {
                  updateState({ searchQuery: `tag:${tag.name}`, currentView: "search" })
                }}
              >
                <div className={`w-2 h-2 rounded-full bg-${tag.color}-500 mr-2 flex-shrink-0`} />
                <span className="flex-1 text-left truncate">{tag.name}</span>
                <Badge variant="secondary" className="ml-auto text-xs h-4 px-1">
                  {tag.documentCount}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        <Separator className="mx-4" />

        {/* System */}
        <div className="p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">System</h3>
          <div className="space-y-1">
            {systemItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                className="w-full justify-start h-8 px-2 text-sm hover:bg-gray-100"
                onClick={() => updateState({ currentView: item.id as any })}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.label}
              </Button>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Storage:</span>
            <span>{state.settings?.storageLocation || "browser"}</span>
          </div>
          <div className="flex justify-between">
            <span>Documents:</span>
            <span>{state.documents.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Languages:</span>
            <span>{state.settings?.ocrLanguages?.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
