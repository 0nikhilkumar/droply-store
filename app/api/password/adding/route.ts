import { db } from "@/lib/db";
import { passwords } from "@/lib/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the password data from the request body
    const { type, password, color } = await request.json();

    // Validate the input data
    if (!type || !password || !color) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Insert the new password into the database
    const newPassword = await db.insert(passwords).values({
      userId,
      type,
      password,
      color,
    }).returning();

    // Return the newly created password
    return NextResponse.json(newPassword, { status: 201 });
  } catch (error) {
    console.error("Error adding password:", error);
    return NextResponse.json({ error: "Failed to add password" }, { status: 500 });
  }
}

