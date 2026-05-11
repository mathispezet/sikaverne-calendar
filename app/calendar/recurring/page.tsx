import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getRecurringRulesForUser } from "@/lib/actions/calendar"
import { RecurringRulesManager } from "@/components/calendar/recurring-rules-manager"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"

export default async function RecurringPage() {
  const session = await auth()
  if (!session?.user) redirect("/")

  const rules = await getRecurringRulesForUser(session.user.id)

  return (
    <main className="container mx-auto p-6 max-w-2xl">
      <div className="mb-6">
        <Link
          href="/calendar"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-4"
        >
          <ChevronLeft className="h-4 w-4" />
          Retour au calendrier
        </Link>
        <h1 className="text-3xl font-bold">Règles récurrentes</h1>
        <p className="text-slate-400 mt-1 text-sm">
          Définis tes disponibilités habituelles. Un slot spécifique prend toujours le dessus sur une règle.
        </p>
      </div>

      <RecurringRulesManager userId={session.user.id} initialRules={rules} />
    </main>
  )
}
