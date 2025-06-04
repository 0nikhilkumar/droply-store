import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { authpassword } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// POST: Set or update password
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) {
    return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 });
  }
  const { authType, authPassword } = await req.json();
  if (!authType || !authPassword) {
    return new Response(JSON.stringify({ success: false, message: "Missing data" }), { status: 400 });
  }

  // Check if password already exists for this user
  const existing = await db.query.authpassword.findFirst({
    where: (ap, { eq }) => eq(ap.userId, user.id),
  });

  if (existing) {
    // Update
    await db
      .update(authpassword)
      .set({ authType, authPassword, updatedAt: new Date() })
      .where(eq(authpassword.userId, user.id));
  } else {
    // Insert
    await db.insert(authpassword).values({
      userId: user.id,
      authType,
      authPassword,
    });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
}

// GET: Fetch password type and encrypted password for this user
export async function GET() {
  const user = await currentUser();
  if (!user) {
    return new Response(JSON.stringify({ success: false, message: "Unauthorized" }), { status: 401 });
  }

  const record = await db.query.authpassword.findFirst({
    where: (ap, { eq }) => eq(ap.userId, user.id),
    columns: { authType: true, authPassword: true },
  });

  if (!record) {
    return new Response(JSON.stringify({ success: false, message: "No password set" }), { status: 404 });
  }

  return new Response(JSON.stringify({
    success: true,
    authType: record.authType,
    authPassword: record.authPassword,
  }), { status: 200 });
}