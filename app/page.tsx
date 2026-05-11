import { auth } from "@/auth"
import { SignIn, UserInfo } from "@/components/auth-buttons"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function HomePage() {
  const session = await auth()

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold">Calendrier la Sikaverne</h1>

      {session?.user ? (
        <>
          <UserInfo />
          <Link href="/calendar">
            <Button size="lg">Accéder au calendrier →</Button>
          </Link>
        </>
      ) : (
        <>
          <p className="text-muted-foreground">Connecte-toi pour accéder au calendrier</p>
          <SignIn />
        </>
      )}
    </main>
  )
}