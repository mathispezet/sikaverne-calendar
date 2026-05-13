import Link from "next/link"
import { auth } from "@/auth"
import { SignOut } from "@/components/auth-buttons"
import { CalendarDays, Repeat, Users } from "lucide-react"

export async function SiteHeader() {
  const session = await auth()

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors">
            <CalendarDays className="h-5 w-5 text-primary" />
            <span>Sikaverne</span>
          </Link>
          {session?.user && (
            <nav className="flex items-center gap-4">
              <Link
                href="/calendar"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Calendrier
              </Link>
              <Link
                href="/calendar/common"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Users className="h-3.5 w-3.5" />
                Créneaux communs
              </Link>
              <Link
                href="/calendar/recurring"
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <Repeat className="h-3.5 w-3.5" />
                Règles
              </Link>
            </nav>
          )}
        </div>

        {session?.user && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {session.user.name}
            </span>
            <SignOut />
          </div>
        )}
      </div>
    </header>
  )
}
