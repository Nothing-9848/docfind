import type { OCRLanguage } from "../types"

export class EnhancedOCRService {
  private static supportedLanguages: OCRLanguage[] = [
    { code: "eng", name: "English", nativeName: "English" },
    { code: "hin", name: "Hindi", nativeName: "हिन्दी" },
    { code: "tel", name: "Telugu", nativeName: "తెలుగు" },
    { code: "spa", name: "Spanish", nativeName: "Español" },
    { code: "fra", name: "French", nativeName: "Français" },
    { code: "deu", name: "German", nativeName: "Deutsch" },
    { code: "ita", name: "Italian", nativeName: "Italiano" },
    { code: "por", name: "Portuguese", nativeName: "Português" },
    { code: "rus", name: "Russian", nativeName: "Русский" },
    { code: "jpn", name: "Japanese", nativeName: "日本語" },
    { code: "kor", name: "Korean", nativeName: "한국어" },
    { code: "chi_sim", name: "Chinese Simplified", nativeName: "简体中文" },
    { code: "chi_tra", name: "Chinese Traditional", nativeName: "繁體中文" },
    { code: "ara", name: "Arabic", nativeName: "العربية" },
  ]

  static getSupportedLanguages(): OCRLanguage[] {
    return this.supportedLanguages
  }

  static async processDocument(
    file: File,
    languages: string[] = ["eng"],
    onProgress?: (progress: number) => void,
  ): Promise<{ text: string; confidence: number }> {
    // Simulate OCR processing with realistic text based on language
    return new Promise((resolve) => {
      let progress = 0
      const interval = setInterval(() => {
        progress += Math.random() * 20
        if (onProgress) onProgress(Math.min(progress, 90))

        if (progress >= 90) {
          clearInterval(interval)
          if (onProgress) onProgress(100)

          // Generate realistic text based on primary language
          const primaryLang = languages[0] || "eng"
          const text = this.generateRealisticText(file.name, primaryLang)

          resolve({
            text,
            confidence: 0.85 + Math.random() * 0.1, // 85-95% confidence
          })
        }
      }, 200)
    })
  }

  private static generateRealisticText(filename: string, language: string): string {
    const templates = {
      eng: {
        business: `BUSINESS DOCUMENT

This document contains important business information and strategic planning details. The quarterly report shows significant growth in revenue and market expansion opportunities.

Key Performance Indicators:
• Revenue Growth: 25%
• Customer Acquisition: 1,200 new clients
• Market Share: 15% increase
• Operational Efficiency: 30% improvement

Strategic Objectives for Next Quarter:
1. Expand into emerging markets
2. Launch new product lines
3. Enhance customer experience
4. Implement digital transformation initiatives

Financial Summary:
Total Revenue: $2,500,000
Operating Expenses: $1,800,000
Net Profit: $700,000
ROI: 28%

This confidential document is intended for internal use only.`,

        invoice: `INVOICE #INV-2024-${Math.floor(Math.random() * 1000)
          .toString()
          .padStart(3, "0")}

Date: ${new Date().toLocaleDateString()}
Due Date: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}

Bill To:
ABC Corporation
123 Business Avenue
Suite 100
New York, NY 10001

Description                    Qty    Rate      Amount
Professional Services           40    $125.00   $5,000.00
Consulting Hours               20    $150.00   $3,000.00
Software License                1    $500.00     $500.00
                                              __________
                                    Subtotal:  $8,500.00
                                    Tax (8%):    $680.00
                                    Total:     $9,180.00

Payment Terms: Net 30 days
Thank you for your business!`,

        contract: `SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into on ${new Date().toLocaleDateString()} between the parties for the provision of professional services.

TERMS AND CONDITIONS:

1. SCOPE OF SERVICES
The service provider agrees to deliver the following services:
- Consulting and advisory services
- Technical implementation support
- Project management and coordination
- Quality assurance and testing

2. PAYMENT TERMS
- Total contract value: $50,000
- Payment schedule: Monthly installments
- Late payment fee: 1.5% per month
- Currency: USD

3. DELIVERABLES
All deliverables will be provided according to the agreed timeline and specifications outlined in the project scope document.

4. CONFIDENTIALITY
Both parties agree to maintain strict confidentiality regarding all proprietary information shared during the course of this agreement.

This agreement is governed by the laws of the jurisdiction specified herein.`,
      },

      hin: `व्यावसायिक दस्तावेज़

यह दस्तावेज़ महत्वपूर्ण व्यावसायिक जानकारी और रणनीतिक योजना विवरण शामिल करता है। त्रैमासिक रिपोर्ट राजस्व में महत्वपूर्ण वृद्धि और बाज़ार विस्तार के अवसर दिखाती है।

मुख्य प्रदर्शन संकेतक:
• राजस्व वृद्धि: 25%
• ग्राहक अधिग्रहण: 1,200 नए ग्राहक
• बाज़ार हिस्सेदारी: 15% वृद्धि
• परिचालन दक्षता: 30% सुधार

अगली तिमाही के लिए रणनीतिक उद्देश्य:
1. उभरते बाज़ारों में विस्तार
2. नई उत्पाद श्रृंखला लॉन्च करना
3. ग्राहक अनुभव में सुधार
4. डिजिटल परिवर्तन पहल लागू करना

वित्तीय सारांश:
कुल राजस्व: $25,00,000
परिचालन व्यय: $18,00,000
शुद्ध लाभ: $7,00,000
ROI: 28%

यह गोपनीय दस्तावेज़ केवल आंतरिक उपयोग के लिए है।`,

      tel: `వ్యాపార పత్రం

ఈ పత్రంలో ముఖ్యమైన వ్యాపార సమాచారం మరియు వ్యూహాత్మక ప్రణాళిక వివరాలు ఉన్నాయి. త్రైమాసిక నివేదిక ఆదాయంలో గణనీయమైన వృద్ధి మరియు మార్కెట్ విస్తరణ అవకాశాలను చూపిస్తుంది।

ముఖ్య పనితీరు సూచికలు:
• ఆదాయ వృద్ధి: 25%
• కస్టమర్ సేకరణ: 1,200 కొత్త క్లయింట్లు
• మార్కెట్ వాటా: 15% పెరుగుదల
• కార్యాచరణ సామర్థ్యం: 30% మెరుగుదల

తదుపరి త్రైమాసికానికి వ్యూహాత్మక లక్ష్యాలు:
1. అభివృద్ధి చెందుతున్న మార్కెట్లలోకి విస్తరణ
2. కొత్త ఉత్పత్తి శ్రేణులను ప్రారంభించడం
3. కస్టమర్ అనుభవాన్ని మెరుగుపరచడం
4. డిజిటల్ పరివర్తన కార్యక్రమాలను అమలు చేయడం

ఆర్థిక సారాంశం:
మొత్తం ఆదాయం: $25,00,000
నిర్వహణ ఖర్చులు: $18,00,000
నికర లాభం: $7,00,000
ROI: 28%

ఈ గోప్య పత్రం అంతర్గత వినియోగం కోసం మాత్రమే.`,
    }

    // Determine document type from filename
    const lowerFilename = filename.toLowerCase()
    let docType = "business"

    if (lowerFilename.includes("invoice") || lowerFilename.includes("bill")) {
      docType = "invoice"
    } else if (lowerFilename.includes("contract") || lowerFilename.includes("agreement")) {
      docType = "contract"
    }

    // Get template for language and document type
    const langTemplates = templates[language as keyof typeof templates] || templates.eng
    return langTemplates[docType as keyof typeof langTemplates] || langTemplates.business
  }

  static async detectLanguage(text: string): Promise<string> {
    // Simple language detection based on character patterns
    const hindiPattern = /[\u0900-\u097F]/
    const teluguPattern = /[\u0C00-\u0C7F]/
    const arabicPattern = /[\u0600-\u06FF]/
    const chinesePattern = /[\u4E00-\u9FFF]/
    const japanesePattern = /[\u3040-\u309F\u30A0-\u30FF]/
    const koreanPattern = /[\uAC00-\uD7AF]/

    if (hindiPattern.test(text)) return "hin"
    if (teluguPattern.test(text)) return "tel"
    if (arabicPattern.test(text)) return "ara"
    if (chinesePattern.test(text)) return "chi_sim"
    if (japanesePattern.test(text)) return "jpn"
    if (koreanPattern.test(text)) return "kor"

    return "eng" // Default to English
  }

  static getLanguageName(code: string): string {
    const lang = this.supportedLanguages.find((l) => l.code === code)
    return lang ? lang.nativeName : code
  }
}
