import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Upload, 
  Trash2, 
  Download, 
  RefreshCw, 
  FileText, 
  Database,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'
import { DocumentUpload } from './DocumentUpload'
import { DocumentList } from './DocumentList'
import { LibraryStatus } from './LibraryStatus'
import { useAuth } from '@/contexts/AuthContext'

interface DocumentInfo {
  filename: string
  file_size: number
  file_type: string
  upload_date: string
  last_modified: string
  is_processed: boolean
  chunk_count?: number
}

interface LibraryStatusData {
  total_documents: number
  total_size_bytes: number
  processed_documents: number
  unprocessed_documents: number
  vector_store_status: string
  last_rebuild?: string
}

export const LibraryPage: React.FC = () => {
  const [documents, setDocuments] = useState<DocumentInfo[]>([])
  const [status, setStatus] = useState<LibraryStatusData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRebuilding, setIsRebuilding] = useState(false)
  const { accessToken } = useAuth()

  const fetchDocuments = async () => {
    try {
      if (!accessToken) {
        toast.error('No authentication token available')
        return
      }

      const response = await fetch('/api/library/documents', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.')
        } else {
          throw new Error(`Failed to fetch documents: ${response.status}`)
        }
        return
      }
      
      const data = await response.json()
      setDocuments(data)
    } catch (error) {
      console.error('Error fetching documents:', error)
      toast.error('Failed to load documents')
    }
  }

  const fetchStatus = async () => {
    try {
      if (!accessToken) {
        toast.error('No authentication token available')
        return
      }

      const response = await fetch('/api/library/status', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Authentication failed. Please log in again.')
        } else {
          throw new Error(`Failed to fetch status: ${response.status}`)
        }
        return
      }
      
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Error fetching status:', error)
      toast.error('Failed to load library status')
    }
  }

  const rebuildKnowledgeBase = async () => {
    setIsRebuilding(true)
    try {
      const response = await fetch('/api/library/rebuild', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to rebuild knowledge base')
      }
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        await fetchStatus()
      } else {
        toast.error(data.error || 'Failed to rebuild knowledge base')
      }
    } catch (error) {
      console.error('Error rebuilding knowledge base:', error)
      toast.error('Failed to rebuild knowledge base')
    } finally {
      setIsRebuilding(false)
    }
  }

  const deleteDocument = async (filename: string) => {
    try {
      const response = await fetch(`/api/library/documents/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete document')
      }
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        await fetchDocuments()
        await fetchStatus()
      } else {
        toast.error(data.error || 'Failed to delete document')
      }
    } catch (error) {
      console.error('Error deleting document:', error)
      toast.error('Failed to delete document')
    }
  }

  const downloadDocument = async (filename: string) => {
    try {
      const response = await fetch(`/api/library/documents/${filename}/download`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to download document')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success(`Downloaded ${filename}`)
    } catch (error) {
      console.error('Error downloading document:', error)
      toast.error('Failed to download document')
    }
  }

  const clearKnowledgeBase = async () => {
    if (!confirm('Are you sure you want to clear the entire knowledge base? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch('/api/library/clear', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to clear knowledge base')
      }
      
      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        await fetchStatus()
      } else {
        toast.error(data.error || 'Failed to clear knowledge base')
      }
    } catch (error) {
      console.error('Error clearing knowledge base:', error)
      toast.error('Failed to clear knowledge base')
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([fetchDocuments(), fetchStatus()])
      setIsLoading(false)
    }
    
    loadData()
  }, [])

  const handleDocumentUploaded = async () => {
    await fetchDocuments()
    await fetchStatus()
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Library</h1>
          <p className="text-muted-foreground">
            Manage your network documentation and knowledge base
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={clearKnowledgeBase}
            variant="destructive"
            className="flex items-center gap-2"
            title="Remove all embeddings from the knowledge base"
          >
            <Trash2 className="h-4 w-4" />
            Clear Knowledge Base
          </Button>
          <Button 
            onClick={rebuildKnowledgeBase} 
            disabled={isRebuilding}
            className="flex items-center gap-2"
            title="Recreate knowledge base from all current documents"
          >
            <RefreshCw className={`h-4 w-4 ${isRebuilding ? 'animate-spin' : ''}`} />
            {isRebuilding ? 'Rebuilding...' : 'Rebuild From Files'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="lg:col-span-1">
          <LibraryStatus status={status} />
        </div>

        {/* Upload Card */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DocumentUpload onUploaded={handleDocumentUploaded} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator />

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documents ({documents.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DocumentList 
            documents={documents}
            onDelete={deleteDocument}
            onDownload={downloadDocument}
            formatFileSize={formatFileSize}
          />
        </CardContent>
      </Card>
    </div>
  )
}
