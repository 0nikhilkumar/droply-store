"use client";

import { Breadcrumbs, BreadcrumbItem } from "@heroui/react";
import { Button } from "@heroui/button";
import { ArrowLeft } from "lucide-react";

interface FolderNavigationProps {
  folderPath: Array<{ id: string; name: string }>;
  navigateUp: () => void;
  navigateToPathFolder: (index: number) => void;
}

export default function FolderNavigation({
  folderPath,
  navigateUp,
  navigateToPathFolder,
}: FolderNavigationProps) {
  return (
    <div className="flex items-center gap-3 pb-2">
      <Button
        variant="flat"
        size="sm"
        isIconOnly
        onClick={navigateUp}
        isDisabled={folderPath.length === 0}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Breadcrumbs>
        <BreadcrumbItem
          onClick={() => navigateToPathFolder(-1)}
          className={folderPath.length === 0 ? "font-bold cursor-default" : "cursor-pointer"}
        >
          Home
        </BreadcrumbItem>
        {folderPath.map((folder, index) => (
          <BreadcrumbItem
            key={folder.id}
            onClick={() => navigateToPathFolder(index)}
            className={`${index === folderPath.length - 1 ? "font-bold cursor-default" : "cursor-pointer"} text-ellipsis overflow-hidden max-w-[150px]`}
            title={folder.name}
          >
            {folder.name}
          </BreadcrumbItem>
        ))}
      </Breadcrumbs>
    </div>
  );
}