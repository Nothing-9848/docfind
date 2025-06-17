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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DocumentStore } from "../store/document-store"
import type { AppState } from "../types"

interface SidebarProps {
  state: AppState
}

export function Sidebar({ state }: SidebarProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(["root"]))
  const [searchTerm, setSearchTerm] = useState("")

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: Home, count: null },
    { id: "documents", label: "All Documents", icon: FileText, count: state.documents.length },
    { id: "folders", label: "Folders", icon: FolderOpen, count: state.folders.length - 1 },
    { id: "tags", label: "Tags", icon: Tags, count: state.tags.length },
    { id: "search", label: "Search", icon: Search, count: null },
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
      return folder.children.map((childId) => {
        const childFolder = state.folders.find((f) => f.id === childId)
        return childFolder ? renderFolder(childFolder, level) : null
      })
    }

    const hasChildren = folder.children.length > 0
    const isExpanded = expandedFolders.has(folder.id)
    const documentCount = folder.documentIds.length

    return (
      <div key={folder.id}>
        <Button
          variant={state.selectedFolder === folder.id ? "secondary" : "ghost"}
          className={`w-full justify-start text-left ${level > 0 ? `ml-${level * 4}` : ""}`}
          onClick={() => {
            DocumentStore.setSelectedFolder(folder.id)
            DocumentStore.setCurrentView("folders")
          }}
        >
          <div className="flex items-center flex-1">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleFolder(folder.id)
                }}
                className="mr-1"
              >
                {isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </button>
            )}
            {!hasChildren && <div className="w-4 mr-1" />}
            {getFolderIcon(folder)}
            <span className="ml-2 flex-1">{folder.name}</span>
            {folder.isWatched && <Eye className="h-3 w-3 text-blue-500 mr-1" />}
            {documentCount > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {documentCount}
              </Badge>
            )}
          </div>
        </Button>

        {isExpanded && hasChildren && (
          <div className="ml-4">
            {folder.children.map((childId) => {
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
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <FileText className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">DocuFlow Pro</h1>
            <p className="text-sm text-gray-500">Smart Document Management</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-b border-gray-200">
        <Button className="w-full" onClick={() => DocumentStore.setCurrentView("documents")}>
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
                className="w-full justify-start"
                onClick={() => DocumentStore.setCurrentView(item.id as any)}
              >
                <item.icon className="mr-3 h-4 w-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.count !== null && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.count}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </nav>

        {/* Folders */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-500">Folders</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                // Add new folder logic
                const newFolder = {
                  name: `New Folder ${Date.now()}`,
                  parentId: "root",
                  children: [],
                  documentIds: [],
                  isWatched: false,
                  color: "blue",
                  icon: "folder",
                }
                DocumentStore.addFolder(newFolder)
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-1">{renderFolder(state.folders.find((f) => f.id === "root")!)}</div>
        </div>

        {/* Tags */}
        <div className="px-4 pb-4">
          <h3 className="text-sm font-medium text-gray-500 mb-3">Popular Tags</h3>
          <div className="mb-3">
            <Input
              placeholder="Search tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="space-y-1">
            {filteredTags.slice(0, 8).map((tag) => (
              <Button
                key={tag.id}
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8"
                onClick={() => {
                  DocumentStore.setSearchQuery(`tag:${tag.name}`)
                  DocumentStore.setCurrentView("search")
                }}
              >
                <div className={`w-2 h-2 rounded-full bg-${tag.color}-500 mr-2`} />
                <span className="flex-1 text-left">{tag.name}</span>
                <Badge variant="secondary" className="ml-auto text-xs">
                  {tag.documentCount}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </ScrollArea>

      {/* Settings */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={() => DocumentStore.setCurrentView("settings")}
        >
          <Settings className="mr-3 h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  )
}
