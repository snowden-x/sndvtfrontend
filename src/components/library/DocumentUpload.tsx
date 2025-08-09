import React, { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Upload, X, FileText, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

interface DocumentUploadProps {
  onUploaded: () => void
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUploaded }) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const { accessToken } = useAuth()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [])

  const handleFileSelect = (file: File) => {
    // Validate file type
    const validTypes = ['.txt', '.md', '.pdf', '.doc', '.docx']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    
    if (!validTypes.includes(fileExtension)) {
      toast.error('Invalid file type. Please upload .txt, .md, .pdf, .doc, or .docx files.')
      return
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.')
      return
    }

    setUploadedFile(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileSelect(file)
    }
  }

  const handleUpload = async () => {
    if (!uploadedFile) return

    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)

      const response = await fetch('/api/library/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        toast.success(data.message)
        setUploadedFile(null)
        onUploaded()
      } else {
        toast.error(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }

  const clearFile = () => {
    setUploadedFile(null)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Drag and Drop Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Drop your document here
        </p>
        <p className="text-sm text-gray-500 mb-4">
          or click to browse files
        </p>
        
        <Label htmlFor="file-upload" className="cursor-pointer">
          <Button variant="outline" asChild>
            <span>Choose File</span>
          </Button>
        </Label>
        
        <Input
          id="file-upload"
          type="file"
          className="hidden"
          accept=".txt,.md,.pdf,.doc,.docx"
          onChange={handleFileInputChange}
        />
      </div>

      {/* File Info */}
      {uploadedFile && (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">{uploadedFile.name}</span>
              <span className="text-sm text-gray-500">
                ({formatFileSize(uploadedFile.size)})
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFile}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Upload Button */}
      {uploadedFile && (
        <div className="flex gap-2">
          <Button 
            onClick={handleUpload} 
            disabled={isUploading}
            className="flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload Document
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={clearFile}
            disabled={isUploading}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Supported Formats */}
      <div className="text-sm text-gray-500">
        <p className="font-medium mb-1">Supported formats:</p>
        <p>.txt, .md, .pdf, .doc, .docx (max 10MB)</p>
      </div>
    </div>
  )
}
