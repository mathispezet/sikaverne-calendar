import { signIn, signOut, auth } from "@/auth"
import { Button } from "@/components/ui/button"

export async function SignIn() {
  return (
    <form
      action={async () => {
        "use server"
        await signIn("authentik", { redirectTo: "/" })
      }}
    >
      <Button type="submit">Se connecter avec Authentik</Button>
    </form>
  )
}

export async function SignOut() {
  return (
    <form
      action={async () => {
        "use server"
        await signOut({ redirectTo: "/" })
      }}
    >
      <Button type="submit" variant="outline">Se déconnecter</Button>
    </form>
  )
}

export async function UserInfo() {
  const session = await auth()
  if (!session?.user) return null
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm">
        Connecté en tant que <strong>{session.user.name}</strong>
      </span>
      <SignOut />
    </div>
  )
}