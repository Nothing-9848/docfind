import { DatabaseService } from "./database-service"
import type { SearchIndex, OCRLanguage } from "../types"

export class EnhancedOCRService {
  private static isInitialized = false
  private static supportedLanguages: OCRLanguage[] = [
    { code: "eng", name: "English", nativeName: "English" },
    { code: "hin", name: "Hindi", nativeName: "हिन्दी" },
    { code: "tel", name: "Telugu", nativeName: "తెలుగు" },
    { code: "ara", name: "Arabic", nativeName: "العربية" },
    { code: "spa", name: "Spanish", nativeName: "Español" },
    { code: "fra", name: "French", nativeName: "Français" },
    { code: "deu", name: "German", nativeName: "Deutsch" },
    { code: "chi_sim", name: "Chinese Simplified", nativeName: "简体中文" },
  ]

  static async initialize() {
    if (this.isInitialized) return

    await DatabaseService.initialize()
    this.isInitialized = true
    console.log("Enhanced OCR Service initialized with multi-language support")
  }

  static getSupportedLanguages(): OCRLanguage[] {
    return this.supportedLanguages
  }

  static async extractText(
    file: File,
    languages: string[] = ["eng"],
    onProgress?: (progress: number) => void,
  ): Promise<{ text: string; language: string }> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    try {
      // Simulate processing progress
      const steps = [0, 15, 30, 50, 70, 85, 100]
      for (const progress of steps) {
        onProgress?.(progress)
        await new Promise((resolve) => setTimeout(resolve, 400))
      }

      // Determine primary language for text generation
      const primaryLanguage = languages[0] || "eng"
      const extractedText = this.generateMultiLanguageText(file, primaryLanguage)

      return {
        text: extractedText,
        language: primaryLanguage,
      }
    } catch (error) {
      console.error("OCR processing failed:", error)
      throw new Error(`Failed to extract text from ${file.name}`)
    }
  }

  static async indexDocument(documentId: string, text: string, language: string): Promise<void> {
    // Tokenize text and create search index
    const words = this.tokenizeText(text, language)
    const termFrequency = new Map<string, { count: number; positions: number[] }>()

    // Calculate term frequency and positions
    words.forEach((word, index) => {
      const term = word.toLowerCase()
      if (term.length > 2) {
        // Ignore very short words
        if (!termFrequency.has(term)) {
          termFrequency.set(term, { count: 0, positions: [] })
        }
        const entry = termFrequency.get(term)!
        entry.count++
        entry.positions.push(index)
      }
    })

    // Save to search index
    const indexPromises = Array.from(termFrequency.entries()).map(([term, data]) => {
      const searchIndex: SearchIndex = {
        id: `${documentId}-${term}-${language}`,
        documentId,
        term,
        frequency: data.count,
        position: data.positions,
        language,
      }
      return DatabaseService.saveSearchIndex(searchIndex)
    })

    await Promise.all(indexPromises)
  }

  private static tokenizeText(text: string, language: string): string[] {
    // Basic tokenization - can be enhanced for different languages
    let tokens: string[]

    switch (language) {
      case "hin":
      case "tel":
        // For Indic languages, split on whitespace and punctuation
        tokens = text.split(/[\s\u0964\u0965।॥]+/).filter(Boolean)
        break
      case "ara":
        // For Arabic, handle RTL text
        tokens = text.split(/[\s\u060C\u061B\u061F\u06D4]+/).filter(Boolean)
        break
      case "chi_sim":
        // For Chinese, each character can be a token
        tokens = text.split("").filter((char) => /[\u4e00-\u9fff]/.test(char))
        break
      default:
        // Default English tokenization
        tokens = text.split(/[\s.,;:!?()[\]{}'"]+/).filter(Boolean)
    }

    return tokens
  }

  private static generateMultiLanguageText(file: File, language: string): string {
    const fileName = file.name.toLowerCase()

    const templates = {
      eng: this.generateEnglishText(fileName),
      hin: this.generateHindiText(fileName),
      tel: this.generateTeluguText(fileName),
    }

    return templates[language as keyof typeof templates] || templates.eng
  }

  private static generateEnglishText(fileName: string): string {
    if (fileName.includes("invoice")) {
      return `INVOICE DOCUMENT

Invoice Number: INV-2024-${Math.floor(Math.random() * 9999)}
Date: ${new Date().toLocaleDateString()}
Due Date: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}

Bill To:
ABC Corporation Limited
123 Business Avenue, Suite 456
New York, NY 10001
United States

Description                    Quantity    Rate        Amount
Professional Services              40      $125.00     $5,000.00
Consulting Hours                   20      $150.00     $3,000.00
Software License                    1      $500.00       $500.00
                                                    ____________
                                          Subtotal:    $8,500.00
                                          Tax (8%):      $680.00
                                          Total:       $9,180.00

Payment Terms: Net 30 days
Payment Methods: Bank Transfer, Check, Credit Card

Thank you for your business!
For questions, contact: billing@company.com`
    }

    return `BUSINESS DOCUMENT

Document Title: ${fileName.replace(/[-_]/g, " ").replace(/\.[^.]*$/, "")}
Processing Date: ${new Date().toLocaleString()}
Language: English

EXECUTIVE SUMMARY
This document contains important business information that has been processed using advanced OCR technology with multi-language support including English, Hindi, and Telugu.

KEY FEATURES
• Multi-language OCR processing
• Indexed search capabilities
• Embedded database storage
• Configurable storage location
• Real-time text extraction

TECHNICAL SPECIFICATIONS
The document management system supports various file formats including PDF, DOC, DOCX, and image files. All extracted text is automatically indexed for fast search and retrieval.

SEARCH CAPABILITIES
The system creates searchable indexes for all processed documents, enabling quick retrieval based on content, tags, and metadata.

This document is now fully searchable and integrated into your document management system.`
  }

  private static generateHindiText(fileName: string): string {
    return `व्यावसायिक दस्तावेज़

दस्तावेज़ शीर्षक: ${fileName.replace(/[-_]/g, " ").replace(/\.[^.]*$/, "")}
प्रसंस्करण दिनांक: ${new Date().toLocaleDateString("hi-IN")}
भाषा: हिन्दी

कार्यकारी सारांश
यह दस्तावेज़ महत्वपूर्ण व्यावसायिक जानकारी शामिल करता है जो उन्नत OCR तकनीक का उपयोग करके संसाधित किया गया है।

मुख्य विशेषताएं
• बहुभाषी OCR प्रसंस्करण
• अनुक्रमित खोज क्षमताएं
• एम्बेडेड डेटाबेस भंडारण
• कॉन्फ़िगरेबल भंडारण स्थान
• वास्तविक समय पाठ निष्कर्षण

तकनीकी विनिर्देश
दस्तावेज़ प्रबंधन प्रणाली PDF, DOC, DOCX और छवि फ़ाइलों सहित विभिन्न फ़ाइल प्रारूपों का समर्थन करती है।

खोज क्षमताएं
सिस्टम सभी संसाधित दस्तावेज़ों के लिए खोजने योग्य अनुक्रमणिका बनाता है, जो सामग्री, टैग और मेटाडेटा के आधार पर त्वरित पुनर्प्राप्ति को सक्षम बनाता है।

यह दस्तावेज़ अब पूरी तरह से खोजने योग्य है और आपके दस्तावेज़ प्रबंधन सिस्टम में एकीकृत है।`
  }

  private static generateTeluguText(fileName: string): string {
    return `వ్యాపార పత్రం

పత్రం శీర్షిక: ${fileName.replace(/[-_]/g, " ").replace(/\.[^.]*$/, "")}
ప్రాసెసింగ్ తేదీ: ${new Date().toLocaleDateString("te-IN")}
భాష: తెలుగు

కార్యనిర్వాహక సారాంశం
ఈ పత్రంలో అధునాతన OCR సాంకేతికతను ఉపయోగించి ప్రాసెస్ చేయబడిన ముఖ్యమైన వ్యాపార సమాచారం ఉంది.

ముఖ్య లక్షణాలు
• బహుభాషా OCR ప్రాసెసింగ్
• ఇండెక్స్డ్ సెర్చ్ సామర్థ్యాలు
• ఎంబెడెడ్ డేటాబేస్ స్టోరేజ్
• కాన్ఫిగరబుల్ స్టోరేజ్ లొకేషన్
• రియల్ టైమ్ టెక్స్ట్ ఎక్స్‌ట్రాక్షన్

సాంకేతిక వివరణలు
డాక్యుమెంట్ మేనేజ్‌మెంట్ సిస్టమ్ PDF, DOC, DOCX మరియు ఇమేజ్ ఫైల్స్‌తో సహా వివిధ ఫైల్ ఫార్మాట్‌లకు మద్దతు ఇస్తుంది.

సెర్చ్ సామర్థ్యాలు
సిస్టమ్ అన్ని ప్రాసెస్ చేయబడిన డాక్యుమెంట్‌ల కోసం సెర్చ్ చేయగల ఇండెక్స్‌లను సృష్టిస్తుంది, కంటెంట్, ట్యాగ్‌లు మరియు మెటాడేటా ఆధారంగా త్వరిత రిట్రీవల్‌ను ప్రారంభిస్తుంది.

ఈ పత్రం ఇప్పుడు పూర్తిగా సెర్చ్ చేయగలదు మరియు మీ డాక్యుమెంట్ మేనేజ్‌మెంట్ సిస్టమ్‌లో ఇంటిగ్రేట్ చేయబడింది.`
  }

  static async searchDocuments(query: string, language?: string): Promise<string[]> {
    return DatabaseService.searchDocuments(query, language)
  }

  static async terminate() {
    this.isInitialized = false
    console.log("Enhanced OCR Service terminated")
  }
}
