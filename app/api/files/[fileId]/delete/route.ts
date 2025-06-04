import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { files } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import ImageKit from "imagekit";

// Initialize ImageKit with your credentials
const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY || "",
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || "",
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { fileId } = params;

    if (!fileId) {
      return NextResponse.json(
        { error: "File ID is required" },
        { status: 400 }
      );
    }

    // Get the file to be deleted
    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)));

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Delete file from ImageKit if it's not a folder
    if (!file.isFolder && file.fileUrl) {
      try {
        // Try to get fileId from fileUrl (if you store it in DB, use that directly)
        let imagekitFileId: string | null = null;

        // If you store fileId from ImageKit in DB, use file.imagekitFileId
        // Otherwise, try to extract from fileUrl or path
        const urlWithoutQuery = file.fileUrl.split("?")[0];
        const fileName = urlWithoutQuery.split("/").pop();

        // Search for the file in ImageKit by name
        if (fileName) {
          const searchResults = await imagekit.listFiles({
            name: fileName,
            limit: 1,
          });

          if (searchResults && searchResults.length > 0) {
            imagekitFileId = searchResults[0].fileId;
          }
        }

        // If found, delete by fileId; else, try by fileName (may fail if not unique)
        if (imagekitFileId) {
          await imagekit.deleteFile(imagekitFileId);
        } else if (fileName) {
          // As a fallback, try to delete by fileName (not recommended, but for completeness)
          await imagekit.deleteFile(fileName);
        }
      } catch (error) {
        console.error(`Error deleting file from ImageKit:`, error);
        // Continue to delete from DB even if ImageKit deletion fails
      }
    }

    // Delete file from database
    const [deletedFile] = await db
      .delete(files)
      .where(and(eq(files.id, fileId), eq(files.userId, userId)))
      .returning();

    return NextResponse.json({
      success: true,
      message: "File deleted successfully",
      deletedFile,
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    return NextResponse.json(
      { error: "Failed to delete file" },
      { status: 500 }
    );
  }
}