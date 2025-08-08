import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { IconMoon, IconSun } from '@tabler/icons-react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const next = stored ? stored === 'dark' : prefersDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
  }, [])

  const toggle = () => {
    const next = !isDark
    setIsDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
  }

  return (
    <Button variant="outline" size="icon" onClick={toggle} aria-label="Toggle theme">
      {isDark ? <IconSun className="h-4 w-4" /> : <IconMoon className="h-4 w-4" />}
    </Button>
  )
}


