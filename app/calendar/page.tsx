import { CalendarView } from "@/components/calendar/calendar-view"
import { getUsers, getCalendarDataForWeek } from "@/lib/actions/calendar"
import { getWeekStart } from "@/lib/dates"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Repeat } from "lucide-react"

export default async function CalendarPage() {
  const session = await auth()
  if (!session?.user) redirect("/")

  const weekStart = getWeekStart()
  const [users, { slots, rules }] = await Promise.all([
    getUsers(),
    getCalendarDataForWeek(weekStart),
  ])

  return (
    <main className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Calendrier</h1>
        <Link
          href="/calendar/recurring"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors"
        >
          <Repeat className="h-4 w-4" />
          Règles récurrentes
        </Link>
      </div>
      <CalendarView
        currentUserId={session.user.id}
        initialWeekStart={weekStart.toISOString()}
        initialUsers={users}
        initialSlots={slots}
        initialRules={rules}
      />
    </main>
  )
}
