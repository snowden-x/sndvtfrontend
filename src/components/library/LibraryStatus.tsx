import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  FileText, 
  HardDrive, 
  CheckCircle, 
  AlertCircle,
  Clock
} from 'lucide-react'

interface LibraryStatusData {
  total_documents: number
  total_size_bytes: number
  processed_documents: number
  unprocessed_documents: number
  vector_store_status: string
  last_rebuild?: string
}

interface LibraryStatusProps {
  status: LibraryStatusData | null
}

export const LibraryStatus: React.FC<LibraryStatusProps> = ({ status }) => {
  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Library Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading status...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getVectorStoreStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-100 text-green-800'
      case 'not initialized':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Library Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Documents */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Total Documents</span>
          </div>
          <Badge variant="outline">{status.total_documents}</Badge>
        </div>

        {/* Total Size */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Total Size</span>
          </div>
          <span className="text-sm text-gray-600">
            {formatFileSize(status.total_size_bytes)}
          </span>
        </div>

        {/* Processed Documents */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Processed</span>
          </div>
          <Badge variant="default" className="bg-green-100 text-green-800">
            {status.processed_documents}
          </Badge>
        </div>

        {/* Unprocessed Documents */}
        {status.unprocessed_documents > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Pending</span>
            </div>
            <Badge variant="secondary">
              {status.unprocessed_documents}
            </Badge>
          </div>
        )}

        {/* Vector Store Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">Vector Store</span>
          </div>
          <Badge className={getVectorStoreStatusColor(status.vector_store_status)}>
            {status.vector_store_status}
          </Badge>
        </div>

        {/* Last Rebuild */}
        {status.last_rebuild && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Last Rebuild</span>
            </div>
            <span className="text-sm text-gray-600">
              {formatDate(status.last_rebuild)}
            </span>
          </div>
        )}

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="text-center">
            <p className="text-sm text-gray-600">
              {status.processed_documents === status.total_documents 
                ? 'All documents are processed and ready for use.'
                : `${status.unprocessed_documents} document(s) pending processing.`
              }
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
