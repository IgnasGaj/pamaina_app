import { LogOut, User as UserIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLogout } from '@/hooks/useAuth'
import { useAuthStore } from '@/stores/auth.store'

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

export function Topbar() {
  const user = useAuthStore((state) => state.user)
  const logout = useLogout()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout.mutateAsync()
    void navigate('/login', { replace: true })
  }

  if (!user) return null

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-6">
      <div className="text-sm text-muted-foreground">{user.roleName}</div>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-2 py-1 text-sm outline-none hover:bg-accent">
          <Avatar className="size-7">
            <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
          </Avatar>
          <span className="font-medium">
            {user.firstName} {user.lastName}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled>
            <UserIcon />
            My profile
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={() => void handleLogout()}>
            <LogOut />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
