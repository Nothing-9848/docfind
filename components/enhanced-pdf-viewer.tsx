"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  Maximize2,
  X,
  FileText,
  Loader2,
} from "lucide-react"
import { PDFService } from "../services/pdf-service"

interface EnhancedPDFViewerProps {
  fileUrl?: string
  fileBlob?: Blob
  fileName: string
  onClose?: () => void
  isFullscreen?: boolean
}

export function EnhancedPDFViewer({
  fileUrl,
  fileBlob,
  fileName,
  onClose,
  isFullscreen = false,
}: EnhancedPDFViewerProps) {
  const [pdf, setPdf] = useState<any>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pageText, setPageText] = useState<string>("")
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    loadPDF()
  }, [fileUrl, fileBlob])

  useEffect(() => {
    if (pdf && currentPage && canvasRef.current) {
      renderPage()
    }
  }, [pdf, currentPage, scale, rotation])

  const loadPDF = async () => {
    try {
      setLoading(true)
      setError(null)

      let pdfDocument: any

      if (fileBlob) {
        // Load from blob
        pdfDocument = await PDFService.loadPDF(fileBlob)
      } else if (fileUrl) {
        // Load from URL
        const response = await fetch(fileUrl)
        const arrayBuffer = await response.arrayBuffer()
        pdfDocument = await PDFService.loadPDF(arrayBuffer)
      } else {
        throw new Error("No PDF source provided")
      }

      setPdf(pdfDocument)
      setTotalPages(pdfDocument.numPages)
      setCurrentPage(1)
    } catch (err) {
      setError("Failed to load PDF")
      console.error("PDF loading error:", err)
    } finally {
      setLoading(false)
    }
  }

  const renderPage = async () => {
    if (!pdf || !canvasRef.current) return

    try {
      await PDFService.renderPDFPage(pdf, currentPage, canvasRef.current, scale, rotation)

      // Extract text content for search
      const page = await pdf.getPage(currentPage)
      const textContent = await page.getTextContent()
      const pageTextContent = textContent.items.map((item: any) => item.str).join(" ")
      setPageText(pageTextContent)
    } catch (err) {
      console.error("Page rendering error:", err)
    }
  }

  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum)
    }
  }

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3.0))
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5))
  const rotate = () => setRotation((prev) => (prev + 90) % 360)

  const downloadPDF = () => {
    if (fileBlob) {
      const url = URL.createObjectURL(fileBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading PDF...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg">
        <div className="text-center text-red-600">
          <FileText className="h-12 w-12 mx-auto mb-4" />
          <p className="font-medium">{error}</p>
          <p className="text-sm text-red-500 mt-2">Please try uploading the file again</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-50 bg-white" : ""}`}>
      <Card className={`${isFullscreen ? "h-full rounded-none border-0" : "border border-gray-200"}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100">
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <FileText className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{fileName}</h3>
              <p className="text-sm text-gray-500">PDF Document</p>
            </div>
          </CardTitle>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
              Page {currentPage} of {totalPages}
            </Badge>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className={`${isFullscreen ? "h-full pb-4" : "p-6"}`}>
          {/* Enhanced Toolbar */}
          <div className="flex items-center justify-between mb-6 p-3 bg-gray-50 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="h-8 px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <div className="flex items-center gap-2 mx-2">
                  <Input
                    type="number"
                    value={currentPage}
                    onChange={(e) => goToPage(Number.parseInt(e.target.value))}
                    className="w-16 h-8 text-center text-sm border-gray-300"
                    min={1}
                    max={totalPages}
                  />
                  <span className="text-sm text-gray-500 whitespace-nowrap">of {totalPages}</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="h-8 px-3"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={zoomOut} className="h-8 px-3">
                <ZoomOut className="h-4 w-4" />
              </Button>

              <span className="text-sm text-gray-600 min-w-[60px] text-center font-medium">
                {Math.round(scale * 100)}%
              </span>

              <Button variant="outline" size="sm" onClick={zoomIn} className="h-8 px-3">
                <ZoomIn className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-gray-300 mx-1" />

              <Button variant="outline" size="sm" onClick={rotate} className="h-8 px-3">
                <RotateCw className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm" onClick={downloadPDF} className="h-8 px-3">
                <Download className="h-4 w-4" />
              </Button>

              {!isFullscreen && (
                <Button variant="outline" size="sm" className="h-8 px-3">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* PDF Canvas */}
          <ScrollArea
            className={`${isFullscreen ? "h-[calc(100vh-240px)]" : "h-[600px]"} border border-gray-200 rounded-xl bg-gray-50`}
          >
            <div className="flex justify-center p-6">
              <div className="bg-white shadow-lg rounded-lg overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="max-w-full block"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    transformOrigin: "center center",
                  }}
                />
              </div>
            </div>
          </ScrollArea>

          {/* Page Text Content */}
          {pageText && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                📄 Page Text Content (for search and accessibility)
              </summary>
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
                <p className="text-sm text-gray-600 leading-relaxed">{pageText}</p>
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
