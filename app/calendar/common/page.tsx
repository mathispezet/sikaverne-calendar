import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { getUsers, findCommonSlots } from "@/lib/actions/calendar"
import { CommonSlotsView } from "@/components/calendar/common-slots-view"

export default async function CommonSlotsPage() {
  const session = await auth()
  if (!session?.user) redirect("/")

  // Filtres par défaut : 4 semaines, au moins 2 amis.
  // Les filtres sont ajustables côté client.
  const [users, initialSlots] = await Promise.all([
    getUsers(),
    findCommonSlots({
      weeksAhead: 4,
      minUsers: 2,
    }),
  ])

  return (
    <main className="container mx-auto p-6 max-w-3xl">
      <div className="mb-6">
        <Link
          href="/calendar"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour au calendrier
        </Link>
        <h1 className="text-3xl font-bold">Créneaux communs</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Quand est-ce qu&apos;on se voit ? Les créneaux à venir où plusieurs d&apos;entre nous sont libres en même temps.
        </p>
      </div>

      <CommonSlotsView users={users} initialSlots={initialSlots} />
    </main>
  )
}
