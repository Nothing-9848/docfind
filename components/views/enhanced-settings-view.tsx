"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Settings,
  Database,
  Languages,
  HardDrive,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  AlertCircle,
  FolderOpen,
  Eye,
  EyeOff,
} from "lucide-react"
import { DatabaseService } from "../../services/database-service"
import { EnhancedOCRService } from "../../services/enhanced-ocr-service"
import type { AppState } from "../../types"

interface SettingsViewProps {
  state: AppState
  updateState: (updates: Partial<AppState>) => void
  activeTab?: string
}

export function SettingsView({ state, updateState, activeTab = "settings" }: SettingsViewProps) {
  const [storageUsage, setStorageUsage] = useState({ used: 0, quota: 0 })
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isClearingData, setIsClearingData] = useState(false)
  const [customStoragePath, setCustomStoragePath] = useState("")
  const [watchedFolders, setWatchedFolders] = useState<string[]>([])
  const [newWatchFolder, setNewWatchFolder] = useState("")

  const supportedLanguages = EnhancedOCRService.getSupportedLanguages()

  useEffect(() => {
    DatabaseService.getStorageUsage().then(setStorageUsage).catch(console.error)
    setWatchedFolders(state.folders.filter((f) => f.isWatched).map((f) => f.watchPath || ""))
  }, [state.folders])

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const data = await DatabaseService.exportData()
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `docuflow-backup-${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Export failed:", error)
      alert("Export failed. Please try again.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsImporting(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await DatabaseService.importData(data)

      // Refresh the application state
      window.location.reload()
    } catch (error) {
      console.error("Import failed:", error)
      alert("Import failed. Please check the file format and try again.")
    } finally {
      setIsImporting(false)
    }
  }

  const handleClearData = async () => {
    if (!confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      return
    }

    setIsClearingData(true)
    try {
      await DatabaseService.clearDatabase()
      window.location.reload()
    } catch (error) {
      console.error("Clear data failed:", error)
      alert("Failed to clear data. Please try again.")
    } finally {
      setIsClearingData(false)
    }
  }

  const handleLanguageToggle = (languageCode: string, enabled: boolean) => {
    const newLanguages = enabled
      ? [...state.settings.ocrLanguages, languageCode]
      : state.settings.ocrLanguages.filter((code) => code !== languageCode)

    updateState({
      settings: {
        ...state.settings,
        ocrLanguages: newLanguages,
      },
    })
  }

  const handleAddWatchFolder = () => {
    if (newWatchFolder.trim()) {
      setWatchedFolders([...watchedFolders, newWatchFolder.trim()])
      setNewWatchFolder("")
    }
  }

  const handleRemoveWatchFolder = (path: string) => {
    setWatchedFolders(watchedFolders.filter((p) => p !== path))
  }

  const storagePercentage = storageUsage.quota > 0 ? (storageUsage.used / storageUsage.quota) * 100 : 0

  return (
    <ScrollArea className="h-full">
      <div className="p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Configure your document management system</p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => updateState({ currentView: value as any })}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="languages" className="flex items-center gap-2">
              <Languages className="h-4 w-4" />
              OCR Languages
            </TabsTrigger>
            <TabsTrigger value="database" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Database
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              Storage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="default-language">Default OCR Language</Label>
                  <Select
                    value={state.settings.defaultLanguage}
                    onValueChange={(value) =>
                      updateState({
                        settings: { ...state.settings, defaultLanguage: value },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {supportedLanguages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.nativeName} ({lang.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Backup</Label>
                    <p className="text-sm text-gray-500">Automatically backup data periodically</p>
                  </div>
                  <Switch
                    checked={state.settings.autoBackup}
                    onCheckedChange={(checked) =>
                      updateState({
                        settings: { ...state.settings, autoBackup: checked },
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storage-location">Storage Location</Label>
                  <div className="flex gap-2">
                    <Select
                      value={state.settings.storageLocation}
                      onValueChange={(value) =>
                        updateState({
                          settings: { ...state.settings, storageLocation: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="browser">Browser Storage</SelectItem>
                        <SelectItem value="local">Local Directory</SelectItem>
                        <SelectItem value="cloud">Cloud Storage</SelectItem>
                      </SelectContent>
                    </Select>
                    {state.settings.storageLocation === "local" && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          // In a real app, this would open a directory picker
                          const path = prompt("Enter storage path:", customStoragePath)
                          if (path) setCustomStoragePath(path)
                        }}
                      >
                        <FolderOpen className="h-4 w-4 mr-2" />
                        Browse
                      </Button>
                    )}
                  </div>
                  {customStoragePath && <p className="text-sm text-gray-500">Path: {customStoragePath}</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Folder Watching</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Watched Folders</Label>
                  <p className="text-sm text-gray-500">
                    Automatically import and process new documents from these folders
                  </p>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Enter folder path to watch..."
                    value={newWatchFolder}
                    onChange={(e) => setNewWatchFolder(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleAddWatchFolder()}
                  />
                  <Button onClick={handleAddWatchFolder}>
                    <Eye className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                <div className="space-y-2">
                  {watchedFolders.map((path, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-green-500" />
                        <span className="font-mono text-sm">{path}</span>
                        <Badge variant="secondary">Active</Badge>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveWatchFolder(path)}>
                        <EyeOff className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {watchedFolders.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-4">No folders are being watched</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="languages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>OCR Language Support</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Select the languages you want to enable for OCR processing. More languages may increase processing
                    time.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {supportedLanguages.map((lang) => (
                      <div key={lang.code} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={lang.code}
                            checked={state.settings.ocrLanguages.includes(lang.code)}
                            onCheckedChange={(checked) => handleLanguageToggle(lang.code, !!checked)}
                          />
                          <div>
                            <Label htmlFor={lang.code} className="font-medium">
                              {lang.nativeName}
                            </Label>
                            <p className="text-sm text-gray-500">{lang.name}</p>
                          </div>
                        </div>
                        {state.settings.defaultLanguage === lang.code && <Badge variant="default">Default</Badge>}
                      </div>
                    ))}
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Language Statistics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-blue-700">Enabled Languages:</span>
                        <span className="font-medium ml-2">{state.settings.ocrLanguages.length}</span>
                      </div>
                      <div>
                        <span className="text-blue-700">Default Language:</span>
                        <span className="font-medium ml-2">
                          {supportedLanguages.find((l) => l.code === state.settings.defaultLanguage)?.nativeName}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="database" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Database Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <Database className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                    <p className="font-medium">Documents</p>
                    <p className="text-2xl font-bold text-blue-600">{state.documents.length}</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <FolderOpen className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="font-medium">Folders</p>
                    <p className="text-2xl font-bold text-green-600">{state.folders.length - 1}</p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Languages className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                    <p className="font-medium">Search Terms</p>
                    <p className="text-2xl font-bold text-purple-600">~{state.documents.length * 50}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Data Operations</h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button
                      onClick={handleExportData}
                      disabled={isExporting}
                      className="h-auto p-4 flex-col items-start"
                    >
                      {isExporting ? (
                        <RefreshCw className="h-5 w-5 animate-spin mb-2" />
                      ) : (
                        <Download className="h-5 w-5 mb-2" />
                      )}
                      <span className="font-medium">Export Data</span>
                      <span className="text-xs opacity-75">Download backup file</span>
                    </Button>

                    <div>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="hidden"
                        id="import-file"
                      />
                      <Button asChild disabled={isImporting} className="h-auto p-4 flex-col items-start w-full">
                        <label htmlFor="import-file" className="cursor-pointer">
                          {isImporting ? (
                            <RefreshCw className="h-5 w-5 animate-spin mb-2" />
                          ) : (
                            <Upload className="h-5 w-5 mb-2" />
                          )}
                          <span className="font-medium">Import Data</span>
                          <span className="text-xs opacity-75">Restore from backup</span>
                        </label>
                      </Button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <Button
                      variant="destructive"
                      onClick={handleClearData}
                      disabled={isClearingData}
                      className="w-full h-auto p-4 flex-col"
                    >
                      {isClearingData ? (
                        <RefreshCw className="h-5 w-5 animate-spin mb-2" />
                      ) : (
                        <Trash2 className="h-5 w-5 mb-2" />
                      )}
                      <span className="font-medium">Clear All Data</span>
                      <span className="text-xs opacity-75">This action cannot be undone</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="storage" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Storage Usage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span>Used: {formatBytes(storageUsage.used)}</span>
                    <span>Available: {formatBytes(storageUsage.quota - storageUsage.used)}</span>
                  </div>
                  <Progress value={storagePercentage} className="h-3" />
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Storage Type: {state.settings.storageLocation}</span>
                    <span>{storagePercentage.toFixed(1)}% used</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Documents</h4>
                    <p className="text-2xl font-bold text-blue-600">{state.documents.length}</p>
                    <p className="text-sm text-gray-500">
                      ~{formatBytes(state.documents.reduce((acc, doc) => acc + doc.size, 0))}
                    </p>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium mb-2">Search Index</h4>
                    <p className="text-2xl font-bold text-green-600">~{state.documents.length * 50}</p>
                    <p className="text-sm text-gray-500">Indexed terms</p>
                  </div>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-800">Storage Recommendations</h4>
                      <ul className="text-sm text-yellow-700 mt-2 space-y-1">
                        <li>• Regular backups are recommended for data safety</li>
                        <li>• Consider cloud storage for better accessibility</li>
                        <li>• Monitor storage usage to prevent data loss</li>
                        {storagePercentage > 80 && (
                          <li className="font-medium">• Storage is getting full - consider cleanup</li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ScrollArea>
  )
}
