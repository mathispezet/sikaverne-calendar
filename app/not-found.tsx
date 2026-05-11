import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <main className="container mx-auto p-6 flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
      <p className="text-xl font-semibold">Page introuvable</p>
      <p className="text-muted-foreground">Cette page n'existe pas ou a été déplacée.</p>
      <Button asChild>
        <Link href="/">Retour à l'accueil</Link>
      </Button>
    </main>
  )
}
