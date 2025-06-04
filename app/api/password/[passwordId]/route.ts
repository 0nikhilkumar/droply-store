import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { passwords } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function DELETE(request: NextRequest, { params }: { params: { passwordId: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the password ID from the request params
    const { passwordId } = params;

    // Validate the input data
    if (!passwordId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Delete the password from the database
    await db
      .delete(passwords)
      .where(
        and(eq(passwords.id, passwordId), eq(passwords.userId, userId))
      );

    // Return a success response
    return NextResponse.json({ message: "Password deleted successfully" });
  } catch (error) {
    console.error("Error deleting password:", error);
    return NextResponse.json(
      { error: "Failed to delete password" },
      { status: 500 }
    );
  }
}


export async function PATCH(
  request: NextRequest,
  { params }: { params: { passwordId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const passwordId = params.passwordId; // <-- use passwordId
    const body = await request.json();

    // Validate the input data
    if (!passwordId) {
      return NextResponse.json(
        { error: "Password ID is required" },
        { status: 400 }
      );
    }

    if (!body.type || !body.password || !body.color) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Update the password in the database
    const updatedPassword = await db
      .update(passwords)
      .set({
        type: body.type,
        password: body.password,
        color: body.color,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(passwords.id, passwordId),
          eq(passwords.userId, userId)
        )
      )
      .returning();

    return NextResponse.json(updatedPassword[0]);
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}


export async function GET(
  request: NextRequest,
  { params }: { params: { passwordId: string } }
) {
  try {
    const { userId } = await auth();
    console.log(userId);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the password ID from the route params
    const passwordId = params.passwordId;

    // Validate the input data
    if (!passwordId) {
      return NextResponse.json(
        { error: "Password ID is required" },
        { status: 400 }
      );
    }

    // Fetch the password from the database
    const password = await db
      .select()
      .from(passwords)
      .where(
        and(
          eq(passwords.id, passwordId),
          eq(passwords.userId, userId)
        )
      );

    // Check if password exists
    if (!password || password.length === 0) {
      return NextResponse.json(
        { error: "Password not found" },
        { status: 404 }
      );
    }

    // Return the password
    return NextResponse.json(password[0]);
  } catch (error) {
    console.error("Error fetching password:", error);
    return NextResponse.json(
      { error: "Failed to fetch password" },
      { status: 500 }
    );
  }
}