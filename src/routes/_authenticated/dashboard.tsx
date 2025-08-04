import React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { ChartAreaInteractive } from '@/components/chart-area-interactive'
import { DataTable } from '@/components/data-table'
import { SectionCards } from '@/components/section-cards'
import { NetworkScanner } from '@/components/NetworkScanner'
import data from '@/app/dashboard/data.json'

export const Route = createFileRoute('/_authenticated/dashboard')({
  component: DashboardComponent,
})

function DashboardComponent() {
  return (
    <div className="space-y-6">
      <SectionCards />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <ChartAreaInteractive />
        </div>
        <div>
          <NetworkScanner />
        </div>
      </div>
      <DataTable data={data} />
    </div>
  )
}