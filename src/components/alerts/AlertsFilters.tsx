import { useState } from 'react'
import { 
  IconFilter, 
  IconX, 
  IconRefresh,
  IconDownload,
  IconTrash,
  IconTrashX
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface AlertFilters {
  severity?: string
  acknowledged?: boolean
  device?: string
  hours_back?: number
}

interface AlertsFiltersProps {
  filters: AlertFilters
  onFiltersChange: (filters: AlertFilters) => void
  onRefresh?: () => void
  onExport?: () => void
  onClearAll?: () => void
  onClearAcknowledged?: () => void
  loading?: boolean
  className?: string
}

const severityOptions = [
  { value: 'all', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const timeRangeOptions = [
  { value: 1, label: 'Last hour' },
  { value: 6, label: 'Last 6 hours' },
  { value: 24, label: 'Last 24 hours' },
  { value: 72, label: 'Last 3 days' },
  { value: 168, label: 'Last week' },
]

export function AlertsFilters({ 
  filters, 
  onFiltersChange, 
  onRefresh,
  onExport,
  onClearAll,
  onClearAcknowledged,
  loading = false,
  className 
}: AlertsFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localFilters, setLocalFilters] = useState<AlertFilters>(filters)

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    setIsOpen(false)
  }

  const handleClearFilters = () => {
    const clearedFilters = {}
    setLocalFilters(clearedFilters)
    onFiltersChange(clearedFilters)
    setIsOpen(false)
  }

  const handleFilterChange = (key: keyof AlertFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }))
  }

  const activeFiltersCount = Object.values(filters).filter(v => v !== undefined && v !== '').length

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Quick severity filter */}
      <Select
        value={filters.severity || 'all'}
        onValueChange={(value) => onFiltersChange({ ...filters, severity: value === 'all' ? undefined : value })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Severity" />
        </SelectTrigger>
        <SelectContent>
          {severityOptions.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Time range filter */}
      <Select
        value={filters.hours_back?.toString() || '24'}
        onValueChange={(value) => onFiltersChange({ 
          ...filters, 
          hours_back: value ? parseInt(value) : undefined 
        })}
      >
        <SelectTrigger className="w-40">
          <SelectValue placeholder="Time range" />
        </SelectTrigger>
        <SelectContent>
          {timeRangeOptions.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Advanced filters */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative">
            <IconFilter className="h-4 w-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge 
                variant="secondary" 
                className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Filter Alerts</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <IconX className="h-4 w-4" />
              </Button>
            </div>

            {/* Device filter */}
            <div className="space-y-2">
              <Label htmlFor="device-filter">Device Name</Label>
              <Input
                id="device-filter"
                placeholder="Filter by device name..."
                value={localFilters.device || ''}
                onChange={(e) => handleFilterChange('device', e.target.value)}
              />
            </div>

            {/* Acknowledgment status */}
            <div className="space-y-3">
              <Label>Acknowledgment Status</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="all-alerts"
                    checked={localFilters.acknowledged === undefined}
                    onCheckedChange={(checked) => {
                      if (checked) handleFilterChange('acknowledged', undefined)
                    }}
                  />
                  <Label htmlFor="all-alerts" className="text-sm">All alerts</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="unacknowledged"
                    checked={localFilters.acknowledged === false}
                    onCheckedChange={(checked) => {
                      if (checked) handleFilterChange('acknowledged', false)
                    }}
                  />
                  <Label htmlFor="unacknowledged" className="text-sm">Unacknowledged only</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="acknowledged"
                    checked={localFilters.acknowledged === true}
                    onCheckedChange={(checked) => {
                      if (checked) handleFilterChange('acknowledged', true)
                    }}
                  />
                  <Label htmlFor="acknowledged" className="text-sm">Acknowledged only</Label>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
              >
                Clear All
              </Button>
              <Button
                size="sm"
                onClick={handleApplyFilters}
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Action buttons */}
      <div className="flex items-center gap-2 ml-auto">
        {/* Clear alerts dropdown */}
        {(onClearAll || onClearAcknowledged) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <IconTrash className="h-4 w-4 mr-2" />
                Clear
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {onClearAcknowledged && (
                <DropdownMenuItem onClick={onClearAcknowledged}>
                  <IconTrashX className="h-4 w-4 mr-2" />
                  Clear Acknowledged
                </DropdownMenuItem>
              )}
              {onClearAll && (
                <>
                  {onClearAcknowledged && <DropdownMenuSeparator />}
                  <DropdownMenuItem 
                    onClick={onClearAll}
                    className="text-destructive focus:text-destructive"
                  >
                    <IconTrash className="h-4 w-4 mr-2" />
                    Clear All Alerts
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <IconRefresh className={cn("h-4 w-4", loading && "animate-spin")} />
          </Button>
        )}
        
        {onExport && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
          >
            <IconDownload className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}