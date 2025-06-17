"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Database, Eye, Zap, Shield, Download, Upload, Trash2, RefreshCw, HardDrive } from "lucide-react"
import type { AppState } from "../../types"

interface SettingsViewProps {
  state: AppState
}

export function SettingsView({ state }: SettingsViewProps) {
  const [ocrEnabled, setOcrEnabled] = useState(true)
  const [autoWatch, setAutoWatch] = useState(true)
  const [storageLimit, setStorageLimit] = useState("1000")
  const [ocrLanguage, setOcrLanguage] = useState("eng")

  const totalStorage = state.documents.reduce((total, doc) => total + doc.size, 0)
  const storageUsedMB = (totalStorage / (1024 * 1024)).toFixed(1)
  const storageUsedPercent = (totalStorage / (Number.parseInt(storageLimit) * 1024 * 1024)) * 100

  const watchedFolders = state.folders.filter((f) => f.isWatched)

  return (
    <div className="flex-1 overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Configure your document management system</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* OCR Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                OCR Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="ocr-enabled">Enable OCR Processing</Label>
                  <p className="text-sm text-gray-500">Automatically extract text from images and PDFs</p>
                </div>
                <Switch id="ocr-enabled" checked={ocrEnabled} onCheckedChange={setOcrEnabled} />
              </div>

              <div>
                <Label htmlFor="ocr-language">OCR Language</Label>
                <Select value={ocrLanguage} onValueChange={setOcrLanguage}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="eng">English</SelectItem>
                    <SelectItem value="spa">Spanish</SelectItem>
                    <SelectItem value="fra">French</SelectItem>
                    <SelectItem value="deu">German</SelectItem>
                    <SelectItem value="chi_sim">Chinese (Simplified)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">OCR Status</span>
                  <Badge variant="secondary">Ready</Badge>
                </div>
                <p className="text-sm text-gray-500">
                  {state.documents.filter((d) => d.ocrText).length} documents processed
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Folder Watching */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Folder Watching
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-watch">Auto-import New Files</Label>
                  <p className="text-sm text-gray-500">Automatically process files added to watched folders</p>
                </div>
                <Switch id="auto-watch" checked={autoWatch} onCheckedChange={setAutoWatch} />
              </div>

              <div>
                <Label>Watched Folders</Label>
                <div className="mt-2 space-y-2">
                  {watchedFolders.map((folder) => (
                    <div
                      key={folder.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{folder.name}</p>
                        <p className="text-sm text-gray-500">{folder.watchPath}</p>
                      </div>
                      <Badge variant="secondary">Active</Badge>
                    </div>
                  ))}
                  {watchedFolders.length === 0 && (
                    <p className="text-sm text-gray-500 py-4">No folders are being watched</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Storage Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Storage Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Storage Usage</Label>
                  <span className="text-sm text-gray-500">{storageUsedMB} MB used</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${Math.min(storageUsedPercent, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {storageUsedPercent.toFixed(1)}% of {storageLimit} MB limit
                </p>
              </div>

              <div>
                <Label htmlFor="storage-limit">Storage Limit (MB)</Label>
                <Input
                  id="storage-limit"
                  type="number"
                  value={storageLimit}
                  onChange={(e) => setStorageLimit(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total Documents</p>
                    <p className="font-medium">{state.documents.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Average Size</p>
                    <p className="font-medium">
                      {state.documents.length > 0
                        ? (totalStorage / state.documents.length / 1024).toFixed(0) + " KB"
                        : "0 KB"}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <Download className="h-4 w-4 mr-2" />
                Export All Data
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <Upload className="h-4 w-4 mr-2" />
                Import Data
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <RefreshCw className="h-4 w-4 mr-2" />
                Rebuild Search Index
              </Button>

              <div className="pt-4 border-t">
                <Button variant="destructive" className="w-full justify-start">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear All Data
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  This action cannot be undone. All documents and settings will be permanently deleted.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* System Information */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500">Version</p>
                <p className="font-medium">DocuFlow Pro v2.1.0</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Last Backup</p>
                <p className="font-medium">Never</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">OCR Engine</p>
                <p className="font-medium">Tesseract.js v4.1.1</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
