import { createFileRoute } from '@tanstack/react-router'
import { LibraryPage } from '@/components/library/LibraryPage'

export const Route = createFileRoute('/_authenticated/library')({
  component: LibraryPage,
})
