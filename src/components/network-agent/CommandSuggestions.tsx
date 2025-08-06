import React, { useState } from 'react'
import { 
  IconTerminal, 
  IconChevronRight,
  IconSearch,
  IconNetwork,
  IconEye,
  IconActivity,
  IconSettings
} from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface Device {
  id: string
  device_name: string
  device_type?: string
  ip_address?: string
  is_reachable: string
}

interface CommandSuggestionsProps {
  selectedDevice: Device | null
  onCommandSelect: (command: string) => void
  className?: string
}

interface CommandCategory {
  name: string
  icon: React.ReactNode
  commands: Array<{
    command: string
    description: string
    deviceTypes?: string[]
  }>
}

const commandCategories: CommandCategory[] = [
  {
    name: 'Interface Status',
    icon: <IconNetwork className="h-4 w-4" />,
    commands: [
      {
        command: 'show ip interface brief',
        description: 'Show interface status summary',
        deviceTypes: ['router', 'switch']
      },
      {
        command: 'show interfaces status',
        description: 'Show detailed interface status',
        deviceTypes: ['switch']
      },
      {
        command: 'show interfaces',
        description: 'Show detailed interface information',
        deviceTypes: ['router', 'switch']
      }
    ]
  },
  {
    name: 'Routing & Connectivity',
    icon: <IconSearch className="h-4 w-4" />,
    commands: [
      {
        command: 'show ip route',
        description: 'Show routing table',
        deviceTypes: ['router']
      },
      {
        command: 'show arp',
        description: 'Show ARP table',
        deviceTypes: ['router', 'switch']
      },
      {
        command: 'ping 8.8.8.8',
        description: 'Test connectivity to Google DNS',
        deviceTypes: ['router', 'switch']
      },
      {
        command: 'traceroute 8.8.8.8',
        description: 'Trace route to Google DNS',
        deviceTypes: ['router']
      }
    ]
  },
  {
    name: 'System Information',
    icon: <IconEye className="h-4 w-4" />,
    commands: [
      {
        command: 'show version',
        description: 'Show system version and hardware info',
        deviceTypes: ['router', 'switch', 'firewall']
      },
      {
        command: 'show inventory',
        description: 'Show hardware inventory',
        deviceTypes: ['router', 'switch']
      },
      {
        command: 'show running-config',
        description: 'Show current configuration',
        deviceTypes: ['router', 'switch', 'firewall']
      }
    ]
  },
  {
    name: 'Performance & Monitoring',
    icon: <IconActivity className="h-4 w-4" />,
    commands: [
      {
        command: 'show processes cpu',
        description: 'Show CPU utilization',
        deviceTypes: ['router', 'switch']
      },
      {
        command: 'show memory',
        description: 'Show memory usage',
        deviceTypes: ['router', 'switch']
      },
      {
        command: 'show logging',
        description: 'Show system logs',
        deviceTypes: ['router', 'switch', 'firewall']
      }
    ]
  },
  {
    name: 'VLAN & Switching',
    icon: <IconSettings className="h-4 w-4" />,
    commands: [
      {
        command: 'show vlan brief',
        description: 'Show VLAN summary',
        deviceTypes: ['switch']
      },
      {
        command: 'show spanning-tree',
        description: 'Show spanning tree status',
        deviceTypes: ['switch']
      },
      {
        command: 'show mac address-table',
        description: 'Show MAC address table',
        deviceTypes: ['switch']
      }
    ]
  }
]

export function CommandSuggestions({ 
  selectedDevice, 
  onCommandSelect, 
  className 
}: CommandSuggestionsProps) {
  const [openCategories, setOpenCategories] = useState<string[]>(['Interface Status'])

  const toggleCategory = (categoryName: string) => {
    setOpenCategories(prev => 
      prev.includes(categoryName)
        ? prev.filter(name => name !== categoryName)
        : [...prev, categoryName]
    )
  }

  const getFilteredCommands = (category: CommandCategory) => {
    if (!selectedDevice || !selectedDevice.device_type) {
      return category.commands
    }

    return category.commands.filter(cmd => 
      !cmd.deviceTypes || cmd.deviceTypes.includes(selectedDevice.device_type!)
    )
  }

  const getAvailableCategories = () => {
    return commandCategories.map(category => ({
      ...category,
      commands: getFilteredCommands(category)
    })).filter(category => category.commands.length > 0)
  }

  const availableCategories = getAvailableCategories()

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <IconTerminal className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Quick Commands</span>
        {selectedDevice && (
          <Badge variant="outline" className="text-xs">
            {selectedDevice.device_name}
          </Badge>
        )}
      </div>

      <div className="space-y-2">
        {availableCategories.map((category) => (
          <Collapsible
            key={category.name}
            open={openCategories.includes(category.name)}
            onOpenChange={() => toggleCategory(category.name)}
          >
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-2 h-auto"
              >
                <div className="flex items-center gap-2">
                  {category.icon}
                  <span className="text-sm">{category.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {category.commands.length}
                  </Badge>
                </div>
                <IconChevronRight 
                  className={`h-4 w-4 transition-transform ${
                    openCategories.includes(category.name) ? 'rotate-90' : ''
                  }`} 
                />
              </Button>
            </CollapsibleTrigger>
            
            <CollapsibleContent className="space-y-1">
              {category.commands.map((cmd, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  className="w-full justify-start h-auto p-2 text-left"
                  onClick={() => onCommandSelect(cmd.command)}
                >
                  <div className="space-y-1 text-left">
                    <div className="font-mono text-sm">{cmd.command}</div>
                    <div className="text-xs text-muted-foreground">
                      {cmd.description}
                    </div>
                  </div>
                </Button>
              ))}
            </CollapsibleContent>
          </Collapsible>
        ))}
      </div>

      {availableCategories.length === 0 && (
        <div className="text-center py-4 text-muted-foreground">
          <IconTerminal className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <div className="text-sm">
            No commands available
            {selectedDevice && (
              <div className="text-xs">
                for {selectedDevice.device_type || 'this device type'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}