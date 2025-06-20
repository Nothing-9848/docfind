"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalCloseButton, Box } from "@chakra-ui/react"
import type { Document } from "../types/document"
import { ImageViewer } from "./image-viewer"
import { EnhancedPDFViewer } from "./enhanced-pdf-viewer"
import { DocumentStore } from "../store/document-store"

interface DocumentViewerModalProps {
  isOpen: boolean
  onClose: () => void
  document: Document | null
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({ isOpen, onClose, document }) => {
  const [fileBlob, setFileBlob] = useState<Blob | null>(null)

  useEffect(() => {
    const loadFileBlob = async () => {
      if (document && document.type === "pdf") {
        const blob = await DocumentStore.getDocumentBlob(document.id)
        setFileBlob(blob)
      }
    }
    loadFileBlob()
  }, [document])

  if (!document) {
    return null
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{document.name}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Box>
            {document.type === "image" && <ImageViewer imageUrl={document.url} onClose={onClose} />}
            {document.type === "pdf" && (
              <EnhancedPDFViewer fileBlob={fileBlob} fileName={document.name} onClose={onClose} isFullscreen={false} />
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
