import { db } from "@/lib/db";
import { passwords } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Retrieve all passwords for the current user
    const userPasswords = await db
      .select()
      .from(passwords)
      .where(eq(passwords.userId, userId));

    // Return the passwords
    return NextResponse.json(userPasswords);
  } catch (error) {
    console.error("Error fetching passwords:", error);
    return NextResponse.json({ error: "Failed to fetch passwords" }, { status: 500 });
  }
}
