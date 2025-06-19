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
import * as pdfjsLib from "pdfjs-dist"

// Set up PDF.js worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

interface PDFViewerProps {
  fileUrl: string
  fileName: string
  onClose?: () => void
  isFullscreen?: boolean
}

export function PDFViewer({ fileUrl, fileName, onClose, isFullscreen = false }: PDFViewerProps) {
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
  }, [fileUrl])

  useEffect(() => {
    if (pdf && currentPage) {
      renderPage()
    }
  }, [pdf, currentPage, scale, rotation])

  const loadPDF = async () => {
    try {
      setLoading(true)
      setError(null)

      // For demo purposes, we'll simulate PDF loading since we can't load actual files
      // In a real implementation, you would load the actual PDF file
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Simulate PDF document
      const mockPdf = {
        numPages: Math.floor(Math.random() * 10) + 3, // 3-12 pages
        getPage: async (pageNum: number) => ({
          pageNumber: pageNum,
          getViewport: (options: any) => ({
            width: 595 * (options.scale || 1),
            height: 842 * (options.scale || 1),
            scale: options.scale || 1,
            rotation: options.rotation || 0,
          }),
          render: (renderContext: any) => ({
            promise: Promise.resolve(),
          }),
          getTextContent: async () => ({
            items: [
              { str: `This is page ${pageNum} of the PDF document.` },
              { str: `Sample content for ${fileName}` },
              { str: `Generated text content for demonstration purposes.` },
            ],
          }),
        }),
      }

      setPdf(mockPdf)
      setTotalPages(mockPdf.numPages)
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
      const page = await pdf.getPage(currentPage)
      const viewport = page.getViewport({ scale, rotation })

      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      canvas.height = viewport.height
      canvas.width = viewport.width

      // Clear canvas and draw placeholder content
      if (context) {
        context.fillStyle = "#ffffff"
        context.fillRect(0, 0, canvas.width, canvas.height)

        // Draw border
        context.strokeStyle = "#e5e7eb"
        context.lineWidth = 2
        context.strokeRect(0, 0, canvas.width, canvas.height)

        // Draw header
        context.fillStyle = "#1f2937"
        context.font = `${24 * scale}px Arial`
        context.textAlign = "center"
        context.fillText(`${fileName} - Page ${currentPage}`, canvas.width / 2, 50 * scale)

        // Draw content
        context.font = `${16 * scale}px Arial`
        context.textAlign = "left"
        const lines = [
          "This is a PDF preview demonstration.",
          "",
          "In a real implementation, this would show",
          "the actual PDF content using PDF.js.",
          "",
          "Key features would include:",
          "• Full PDF rendering",
          "• Text selection and copying",
          "• Search functionality",
          "• Annotations support",
          "",
          `Current page: ${currentPage} of ${totalPages}`,
          `Zoom level: ${Math.round(scale * 100)}%`,
          `Rotation: ${rotation}°`,
        ]

        lines.forEach((line, index) => {
          context.fillText(line, 50 * scale, (120 + index * 25) * scale)
        })
      }

      // Extract text content for search
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading PDF...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-600">
          <FileText className="h-12 w-12 mx-auto mb-4" />
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${isFullscreen ? "fixed inset-0 z-50 bg-white" : ""}`}>
      <Card className={`${isFullscreen ? "h-full rounded-none" : ""}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {fileName}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">
              Page {currentPage} of {totalPages}
            </Badge>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className={`${isFullscreen ? "h-full pb-4" : ""}`}>
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 p-2 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)} disabled={currentPage <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={currentPage}
                  onChange={(e) => goToPage(Number.parseInt(e.target.value))}
                  className="w-16 h-8 text-center"
                  min={1}
                  max={totalPages}
                />
                <span className="text-sm text-gray-500">of {totalPages}</span>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={zoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>

              <span className="text-sm text-gray-600 min-w-[60px] text-center">{Math.round(scale * 100)}%</span>

              <Button variant="outline" size="sm" onClick={zoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm" onClick={rotate}>
                <RotateCw className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="sm">
                <Download className="h-4 w-4" />
              </Button>

              {!isFullscreen && (
                <Button variant="outline" size="sm">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* PDF Canvas */}
          <ScrollArea className={`${isFullscreen ? "h-[calc(100vh-200px)]" : "h-96"} border rounded-lg`}>
            <div className="flex justify-center p-4">
              <canvas
                ref={canvasRef}
                className="shadow-lg max-w-full"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: "center center",
                }}
              />
            </div>
          </ScrollArea>

          {/* Page Text Content (for search/accessibility) */}
          {pageText && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700">
                Page Text Content (for search)
              </summary>
              <div className="mt-2 p-3 bg-gray-50 rounded text-sm text-gray-600 max-h-32 overflow-y-auto">
                {pageText}
              </div>
            </details>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
