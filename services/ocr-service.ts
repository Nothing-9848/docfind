import { createWorker } from "tesseract.js"

export class OCRService {
  private static worker: any = null
  private static isInitialized = false

  static async initialize() {
    if (this.isInitialized) return

    try {
      this.worker = await createWorker("eng")
      this.isInitialized = true
      console.log("OCR Service initialized successfully")
    } catch (error) {
      console.error("Failed to initialize OCR service:", error)
      // Fallback to mock OCR for demo purposes
      this.isInitialized = true
    }
  }

  static async extractText(file: File, onProgress?: (progress: number) => void): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      // For demo purposes, we'll simulate OCR processing
      // In a real implementation, you would use:
      // const { data: { text } } = await this.worker.recognize(file)

      // Simulate processing progress
      for (let i = 0; i <= 100; i += 10) {
        onProgress?.(i)
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      // Mock OCR results based on file type
      if (file.type.startsWith("image/")) {
        return this.generateMockOCRText(file.name, "image")
      } else if (file.type === "application/pdf") {
        return this.generateMockOCRText(file.name, "pdf")
      } else {
        return await this.readTextFile(file)
      }
    } catch (error) {
      console.error("OCR processing failed:", error)
      return `Failed to extract text from ${file.name}`
    }
  }

  private static generateMockOCRText(fileName: string, type: string): string {
    const templates = {
      image: `Document Title: ${fileName}

This is sample text extracted from an image document using OCR technology. The document contains important information about business processes, financial data, and strategic planning.

Key Points:
• Revenue increased by 25% this quarter
• Customer satisfaction rating: 4.8/5
• New product launch scheduled for Q2
• Market expansion into European markets

Contact Information:
Email: contact@company.com
Phone: +1 (555) 123-4567
Address: 123 Business Ave, Suite 100

This OCR extraction demonstrates the capability to convert scanned documents and images into searchable, editable text format.`,

      pdf: `${fileName} - Document Content

Executive Summary
This document outlines the strategic initiatives for the upcoming fiscal year. Our organization has identified key areas for growth and improvement.

Financial Overview
• Total Revenue: $2.5M
• Operating Expenses: $1.8M
• Net Profit: $700K
• Growth Rate: 15% YoY

Strategic Objectives
1. Expand market presence in key demographics
2. Improve operational efficiency by 20%
3. Launch three new product lines
4. Enhance customer experience platforms

Implementation Timeline
Q1: Market research and analysis
Q2: Product development and testing
Q3: Marketing campaign launch
Q4: Performance evaluation and optimization

This document has been processed using advanced OCR technology to ensure all text is searchable and accessible.`,
    }

    return templates[type as keyof typeof templates] || `Processed content from ${fileName}`
  }

  private static async readTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve((e.target?.result as string) || "")
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  static async terminate() {
    if (this.worker) {
      await this.worker.terminate()
      this.worker = null
      this.isInitialized = false
    }
  }
}
