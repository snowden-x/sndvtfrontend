import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Network, Search } from 'lucide-react'

interface ScanResult {
  ip: string;
  hostname?: string;
  status: 'up' | 'down';
  responseTime?: number;
}

export function NetworkScanner() {
  const [networkRange, setNetworkRange] = useState('192.168.1.0/24')
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState<ScanResult[]>([])
  const [error, setError] = useState<string>('')

  const validateCIDR = (cidr: string): boolean => {
    const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/
    return cidrRegex.test(cidr)
  }

  const runNmapScan = async () => {
    if (!validateCIDR(networkRange)) {
      setError('Please enter a valid CIDR network range (e.g., 192.168.1.0/24)')
      return
    }

    setIsScanning(true)
    setError('')
    setScanResults([])

    try {
      console.log(`Running nmap scan on: ${networkRange}`)
      
      // Start the discovery scan
      const response = await fetch('http://localhost:8000/api/devices/discovery/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          network: networkRange,
          scan_type: 'ping',
          timeout: 5,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to start scan')
      }

      const scanData = await response.json()
      const scanId = scanData.scan_id

      // Poll for scan results
      let completed = false
      while (!completed) {
        await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
        
        const statusResponse = await fetch(`http://localhost:8000/api/devices/discovery/scan/${scanId}`)
        if (!statusResponse.ok) {
          throw new Error('Failed to get scan status')
        }

        const statusData = await statusResponse.json()
        
        if (statusData.status === 'completed') {
          completed = true
          
          // Convert backend format to frontend format
          const results: ScanResult[] = statusData.discovered_devices.map((device: any) => ({
            ip: device.ip,
            hostname: device.hostname,
            status: device.status,
            responseTime: device.response_time,
          }))
          
          setScanResults(results)
        } else if (statusData.status === 'failed') {
          throw new Error(statusData.error_message || 'Scan failed')
        }
        // Continue polling if status is 'running'
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run network scan. Please try again.')
      console.error('Scan error:', err)
    } finally {
      setIsScanning(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5" />
          Network Scanner
        </CardTitle>
        <CardDescription>
          Run nmap scan to discover active hosts on your network
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="network-range">Network Range (CIDR)</Label>
          <div className="flex gap-2">
            <Input
              id="network-range"
              placeholder="192.168.1.0/24"
              value={networkRange}
              onChange={(e) => setNetworkRange(e.target.value)}
              disabled={isScanning}
            />
            <Button 
              onClick={runNmapScan} 
              disabled={isScanning}
              className="min-w-[120px]"
            >
              {isScanning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Scan Network
                </>
              )}
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {scanResults.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Scan Results ({scanResults.length} hosts found)</h3>
            <div className="space-y-2">
              {scanResults.map((result, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{result.ip}</div>
                      {result.hostname && (
                        <div className="text-sm text-muted-foreground">{result.hostname}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        result.status === 'up' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {result.status.toUpperCase()}
                      </div>
                      {result.responseTime && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {result.responseTime}ms
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 