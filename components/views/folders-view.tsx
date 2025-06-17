"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { FolderOpen, Plus, Eye, Briefcase, DollarSign, Archive, FileText, Trash2 } from "lucide-react"
import { DocumentStore } from "../../store/document-store"
import type { AppState, Folder } from "../../types"
import { Switch } from "@/components/ui/switch"

interface FoldersViewProps {
  state: AppState
}

export function FoldersView({ state }: FoldersViewProps) {
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")

  const folders = state.folders.filter((f) => f.id !== "root")
  const selectedFolder = state.selectedFolder ? state.folders.find((f) => f.id === state.selectedFolder) : null
  const documentsInFolder = selectedFolder ? state.documents.filter((d) => d.folderId === selectedFolder.id) : []

  const getFolderIcon = (folder: Folder) => {
    const iconMap = {
      briefcase: Briefcase,
      "dollar-sign": DollarSign,
      archive: Archive,
      folder: FolderOpen,
    }
    const IconComponent = iconMap[folder.icon as keyof typeof iconMap] || FolderOpen
    return <IconComponent className="h-5 w-5" />
  }

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      DocumentStore.addFolder({
        name: newFolderName.trim(),
        parentId: "root",
        children: [],
        documentIds: [],
        isWatched: false,
        color: "blue",
        icon: "folder",
      })
      setNewFolderName("")
      setShowCreateFolder(false)
    }
  }

  const toggleFolderWatch = (folderId: string, isWatched: boolean) => {
    DocumentStore.updateFolder(folderId, {
      isWatched,
      watchPath: isWatched ? `/watched/${folderId}` : undefined,
    })

    if (isWatched) {
      // Simulate folder watching
      DocumentStore.simulateFolderWatch(folderId)
    }
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Folders</h1>
            <p className="text-gray-600">Organize documents and set up folder watching</p>
          </div>
          <Button onClick={() => setShowCreateFolder(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Folder
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Folders List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>All Folders</CardTitle>
              </CardHeader>
              <CardContent>
                {showCreateFolder && (
                  <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                    <Label htmlFor="folder-name">Folder Name</Label>
                    <Input
                      id="folder-name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="Enter folder name"
                      className="mt-1"
                      onKeyPress={(e) => e.key === "Enter" && handleCreateFolder()}
                    />
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={handleCreateFolder}>
                        Create
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setShowCreateFolder(false)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {folders.map((folder) => (
                    <Button
                      key={folder.id}
                      variant={state.selectedFolder === folder.id ? "secondary" : "ghost"}
                      className="w-full justify-start"
                      onClick={() => DocumentStore.setSelectedFolder(folder.id)}
                    >
                      <div className="flex items-center flex-1">
                        {getFolderIcon(folder)}
                        <span className="ml-2 flex-1 text-left">{folder.name}</span>
                        {folder.isWatched && <Eye className="h-3 w-3 text-blue-500 mr-1" />}
                        <Badge variant="secondary" className="ml-auto">
                          {folder.documentIds.length}
                        </Badge>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Folder Details */}
          <div className="lg:col-span-2">
            {selectedFolder ? (
              <div className="space-y-6">
                {/* Folder Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getFolderIcon(selectedFolder)}
                      {selectedFolder.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div>
                        <Label className="text-sm text-gray-500">Documents</Label>
                        <p className="text-2xl font-bold">{selectedFolder.documentIds.length}</p>
                      </div>
                      <div>{/* Placeholder for additional folder info */}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Documents in Folder */}
                <Card>
                  <CardHeader>
                    <CardTitle>Documents in {selectedFolder.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {documentsInFolder.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>No documents in this folder</p>
                        <p className="text-sm">Upload documents or move existing ones here</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {documentsInFolder.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{doc.name}</p>
                                <p className="text-sm text-gray-500">
                                  {doc.createdAt.toLocaleDateString()} • {(doc.size / 1024).toFixed(0)} KB
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {doc.tags.slice(0, 2).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Folder Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Folder Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Watch this folder</Label>
                          <p className="text-sm text-gray-500">Automatically import new files added to this folder</p>
                        </div>
                        <Switch
                          checked={selectedFolder.isWatched}
                          onCheckedChange={(checked) => toggleFolderWatch(selectedFolder.id, checked)}
                        />
                      </div>

                      {selectedFolder.isWatched && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <Eye className="h-4 w-4 inline mr-1" />
                            Watching: {selectedFolder.watchPath}
                          </p>
                        </div>
                      )}

                      <div className="pt-4 border-t space-y-2">
                        <Button variant="outline" className="w-full justify-start">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Documents
                        </Button>
                        <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Folder
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-16">
                  <div className="text-center text-gray-500">
                    <FolderOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium mb-2">Select a folder</h3>
                    <p>Choose a folder from the left to view its contents and settings</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
