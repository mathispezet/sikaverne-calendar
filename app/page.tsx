import { auth } from "@/auth"
import { SignIn } from "@/components/auth-buttons"
import { redirect } from "next/navigation"

export default async function HomePage() {
  const session = await auth()

  if (session?.user) redirect("/calendar")

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold">Calendrier la Sikaverne</h1>
      <p className="text-muted-foreground">Connecte-toi pour accéder au calendrier</p>
      <SignIn />
    </main>
  )
}