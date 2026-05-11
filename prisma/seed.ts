import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import "dotenv/config"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

async function main() {
  console.log("🌱 Seeding database...")

  // Tes amis. Mets ici les VRAIES infos (email surtout) pour que ça matche
  // ce qu'Authentik leur attribuera à leur premier login.
  const friends = [
    {
      email: "mathis.pezet81@gmail.com",
      username: "mathis",
      displayName: "Mathis",
      color: "#3b82f6",  // bleu
    },
    {
      email: "ami1@example.com",       // ← remplace
      username: "ami1",
      displayName: "Ami 1",
      color: "#ec4899",  // rose
    },
    {
      email: "ami2@example.com",       // ← remplace
      username: "ami2",
      displayName: "Ami 2",
      color: "#10b981",  // vert
    },
    {
      email: "ami3@example.com",       // ← remplace
      username: "ami3",
      displayName: "Ami 3",
      color: "#f59e0b",  // orange
    },
  ]

  for (const friend of friends) {
    const user = await db.user.upsert({
      where: { email: friend.email },
      update: {
        displayName: friend.displayName,
        color: friend.color,
      },
      create: friend,
    })
    console.log(`  ✓ ${user.displayName} (${user.email})`)
  }

  console.log("✅ Seed completed")
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })