"use client";

import FileList from "@/components/FileList";
import FileUploadForm from "@/components/FileUploadForm";
import UserProfile from "@/components/UserProfile";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Tab, Tabs } from "@heroui/tabs";
import { FileText, FileUp, LockIcon, User } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
import PasswordManager from "./PasswordManager";
import PasswordAuthModal from "./PasswordManagerAuth";

interface DashboardContentProps {
  userId: string;
  userName: string;
}

export default function DashboardContent({
  userId,
  userName,
}: DashboardContentProps) {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");

  const [activeTab, setActiveTab] = useState<string | null>("files");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  // Set the active tab based on URL parameter
  useEffect(() => {
    if (tabParam === "profile") {
      setActiveTab("profile");
    }
    else if (tabParam === "password-manager") {
      setActiveTab("password-manager");
      setIsAuthModalOpen(true);
      setIsUnlocked(false);
    } 
    else {
      setActiveTab("files");
    }
  }, [tabParam]);


  const handleFileUploadSuccess = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleFolderChange = useCallback((folderId: string | null) => {
    setCurrentFolder(folderId);
  }, []);

  return (
    <>
      <PasswordAuthModal
        isOpen={isAuthModalOpen && !isUnlocked}
        onUnlock={() => {
          setIsUnlocked(true);
          setIsAuthModalOpen(false);
        }}
        onClose={() => {
          setIsAuthModalOpen(false);
          setActiveTab("files"); // Strictly switch to My Files tab
        }}
      />
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-default-900">
          Hi,{" "}
          <span className="text-primary">
            {userName?.length > 10
              ? `${userName?.substring(0, 10)}...`
              : userName?.split(" ")[0] || "there"}
          </span>
          !
        </h2>
        <p className="text-default-600 mt-2 text-lg">
          {activeTab === "password-manager"
            ? "You can add your passwords here!"
            : "Your images are waiting for you."}
        </p>
      </div>

      <Tabs
        aria-label="Dashboard Tabs"
        color="primary"
        variant="underlined"
        selectedKey={activeTab}
        onSelectionChange={(key) => {
          setActiveTab(key as string);
          if (key === "password-manager") {
            setIsAuthModalOpen(true);
            setIsUnlocked(false);
          }
        }}
        classNames={{
          tabList: "gap-6",
          tab: "py-3",
          cursor: "bg-primary",
        }}
      >
        <Tab
          key="files"
          title={
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5" />
              <span className="font-medium">My Files</span>
            </div>
          }
        >
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="border border-default-200 bg-default-50 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex gap-3">
                  <FileUp className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Upload</h2>
                </CardHeader>
                <CardBody>
                  <FileUploadForm
                    userId={userId}
                    onUploadSuccess={handleFileUploadSuccess}
                    currentFolder={currentFolder}
                  />
                </CardBody>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="border border-default-200 bg-default-50 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Your Files</h2>
                </CardHeader>
                <CardBody>
                  <FileList
                    userId={userId}
                    refreshTrigger={refreshTrigger}
                    onFolderChange={handleFolderChange}
                  />
                </CardBody>
              </Card>
            </div>
          </div>
        </Tab>

        <Tab
          key="password-manager"
          title={
            <div className="flex items-center gap-3">
              <LockIcon className="h-5 w-5" />
              <span className="font-medium">Password Manager</span>
            </div>
          }
        >
          {isUnlocked ? (
            <PasswordManager userId={userId} />
          ) : (
            <div className="text-center text-default-500 mt-10">
              Please unlock to view your passwords.
            </div>
          )}
        </Tab>

        <Tab
          key="profile"
          title={
            <div className="flex items-center gap-3">
              <User className="h-5 w-5" />
              <span className="font-medium">Profile</span>
            </div>
          }
        >
          <div className="mt-8">
            <UserProfile />
          </div>
        </Tab>
      </Tabs>
    </>
  );
}
