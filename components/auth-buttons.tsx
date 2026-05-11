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
  // Après le logout Auth.js, on redirige vers l'endpoint end_session d'Authentik
  // pour invalider aussi la session côté IdP
  const issuer = process.env.AUTH_AUTHENTIK_ISSUER ?? ""
  const clientId = process.env.AUTH_AUTHENTIK_ID ?? ""
  const appUrl = process.env.AUTH_URL ?? "http://localhost:3000"
  const endSessionUrl = `${issuer}end-session/?client_id=${clientId}&post_logout_redirect_uri=${encodeURIComponent(appUrl)}`

  return (
    <form
      action={async () => {
        "use server"
        await signOut({ redirectTo: endSessionUrl })
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
