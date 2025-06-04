"use client";

import { useUser, useClerk } from "@clerk/nextjs";
import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Spinner } from "@heroui/spinner";
import { Avatar } from "@heroui/avatar";
import { Divider } from "@heroui/divider";
import Badge from "@/components/ui/Badge";
import { useRouter } from "next/navigation";
import { Mail, User, LogOut, Shield, ArrowRight, Pencil, Save } from "lucide-react";
import { useState } from "react";
import { Input } from "@heroui/input";

export default function UserProfile() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  // Edit name state
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState(
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim()
  );
  const [isSaving, setIsSaving] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex flex-col justify-center items-center p-12">
        <Spinner size="lg" color="primary" />
        <p className="mt-4 text-default-600">Loading your profile...</p>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <Card className="max-w-md mx-auto border border-default-200 bg-default-50 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex gap-3">
          <User className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-semibold">User Profile</h2>
        </CardHeader>
        <Divider />
        <CardBody className="text-center py-10">
          <div className="mb-6">
            <Avatar name="Guest" size="lg" className="mx-auto mb-4" />
            <p className="text-lg font-medium">Not Signed In</p>
            <p className="text-default-500 mt-2">
              Please sign in to access your profile
            </p>
          </div>
          <Button
            variant="solid"
            color="primary"
            size="lg"
            onClick={() => router.push("/sign-in")}
            className="px-8"
            endContent={<ArrowRight className="h-4 w-4" />}
          >
            Sign In
          </Button>
        </CardBody>
      </Card>
    );
  }

  const email = user.primaryEmailAddress?.emailAddress || "";
  const initials = fullName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  const userRole = user.publicMetadata.role as string | undefined;

  const handleSignOut = () => {
    signOut(() => {
      router.push("/");
    });
  };

  // Save the new name to Clerk
  const handleSaveName = async () => {
    if (!user) return;
    setIsSaving(true);
    // Split full name into first and last
    const [firstName, ...rest] = fullName.trim().split(" ");
    const lastName = rest.join(" ");
    try {
      await user.update({
        firstName,
        lastName,
      });
      setIsEditing(false);
    } catch (err) {
      // Optionally show error
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto border border-default-200 bg-default-50 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="flex gap-3">
        <User className="h-6 w-6 text-primary" />
        <h2 className="text-xl font-semibold">User Profile</h2>
      </CardHeader>
      <Divider />
      <CardBody className="py-6">
        <div className="flex flex-col items-center text-center mb-6">
          {user.imageUrl ? (
            <Avatar
              src={user.imageUrl}
              alt={fullName}
              size="lg"
              className="mb-4 h-24 w-24"
            />
          ) : (
            <Avatar
              name={initials}
              size="lg"
              className="mb-4 h-24 w-24 text-lg"
            />
          )}
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Input
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-48"
                  size="sm"
                  isDisabled={isSaving}
                />
                <Button
                  isIconOnly
                  color="primary"
                  size="sm"
                  onClick={handleSaveName}
                  isLoading={isSaving}
                  aria-label="Save"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  isIconOnly
                  color="default"
                  size="sm"
                  variant="light"
                  onClick={() => {
                    setIsEditing(false);
                    setFullName(`${user.firstName || ""} ${user.lastName || ""}`.trim());
                  }}
                  isDisabled={isSaving}
                  aria-label="Cancel"
                >
                  ✕
                </Button>
              </>
            ) : (
              <>
                <h3 className="text-xl font-semibold">{fullName}</h3>
                <Button
                  isIconOnly
                  color="primary"
                  size="sm"
                  variant="light"
                  onClick={() => setIsEditing(true)}
                  aria-label="Edit"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          {user.emailAddresses && user.emailAddresses.length > 0 && (
            <div className="flex items-center gap-2 mt-1 text-default-500">
              <Mail className="h-4 w-4" />
              <span>{email}</span>
            </div>
          )}
          {userRole && (
            <Badge
              color="primary"
              variant="flat"
              className="mt-3"
              aria-label={`User role: ${userRole}`}
            >
              {userRole}
            </Badge>
          )}
        </div>

        <Divider className="my-4" />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary/70" />
              <span className="font-medium">Account Status</span>
            </div>
            <Badge
              color="success"
              variant="flat"
              aria-label="Account status: Active"
            >
              Active
            </Badge>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary/70" />
              <span className="font-medium">Email Verification</span>
            </div>
            <Badge
              color={
                user.emailAddresses?.[0]?.verification?.status === "verified"
                  ? "success"
                  : "warning"
              }
              variant="flat"
              aria-label={`Email verification status: ${
                user.emailAddresses?.[0]?.verification?.status === "verified"
                  ? "Verified"
                  : "Pending"
              }`}
            >
              {user.emailAddresses?.[0]?.verification?.status === "verified"
                ? "Verified"
                : "Pending"}
            </Badge>
          </div>
        </div>
      </CardBody>
      <Divider />
      <CardFooter className="flex justify-between">
        <Button
          variant="flat"
          color="danger"
          startContent={<LogOut className="h-4 w-4" />}
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </CardFooter>
    </Card>
  );
}