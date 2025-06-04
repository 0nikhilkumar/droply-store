import { currentUser } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/clerk-sdk-node";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    
    if (!password) {
      return new Response(
        JSON.stringify({ success: false, message: "Password required" }), 
        { status: 400 }
      );
    }

    const user = await currentUser();
    const identifier = user?.primaryEmailAddress?.emailAddress;
    
    if (!user || !identifier) {
      return new Response(
        JSON.stringify({ success: false, message: "Unauthorized" }), 
        { status: 401 }
      );
    }

    try {
      await clerkClient.users.verifyPassword({
        userId: user.id,
        password,
      });

      return new Response(
        JSON.stringify({ success: true }), 
        { status: 200 }
      );
    } catch (err: any) {
      if (err.errors?.[0]?.code === 'form_identifier_or_password_incorrect') {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Incorrect password" 
          }), 
          { status: 403 }
        );
      }
      
      console.error("Password verification error:", err);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Authentication failed" 
        }), 
        { status: 500 }
      );
    }
  } catch (err: any) {
    console.error("Server error:", err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: "Internal server error" 
      }), 
      { status: 500 }
    );
  }
}