import { CalendarView } from "@/components/calendar/calendar-view"
import { getUsers, getSlotsForWeek } from "@/lib/actions/calendar"
import { getWeekStart } from "@/lib/dates"
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function CalendarPage() {
  const session = await auth()
  if (!session?.user) redirect("/")

  const weekStart = getWeekStart()
  const [users, slots] = await Promise.all([
    getUsers(),
    getSlotsForWeek(weekStart),
  ])

  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">📅 Calendrier</h1>
      <CalendarView
        currentUserId={session.user.id}
        initialWeekStart={weekStart.toISOString()}
        initialUsers={users}
        initialSlots={slots}
      />
    </main>
  )
}