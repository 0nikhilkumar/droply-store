"use client";

import React, { useEffect, useState, FormEvent } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Form } from "@heroui/form";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Radio, RadioGroup } from "@heroui/radio";
import {
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from "@heroui/table";
import { Snippet, Spinner, addToast, useDisclosure } from "@heroui/react";
import EditPasswordForm from "./EditPasswordForm";
import Badge from "./ui/Badge";
import ConfirmationModal from "./ui/ConfirmationModal";
import { Eye, EyeOff, LockKeyholeOpenIcon, FileText, Trash } from "lucide-react";
import axios from "axios";

type Color =
  | "default"
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | undefined;

interface IPasswordManager {
  id: string;
  type: string;
  password: string;
  color: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}


export default function PasswordManager({ userId }: { userId: string }) {
  const [passwords, setPasswords] = useState<IPasswordManager[]>([]);
  const [passType, setPassType] = useState("");
  const [passwordInp, setPasswordInp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedColor, setSelectedColor] = useState("default");
  const [isAdding, setIsAdding] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // For confirmation modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const colors = [
    "default",
    "primary",
    "secondary",
    "success",
    "warning",
    "danger",
  ] as const;

  // Fetch passwords
  useEffect(() => {
    const fetchPasswords = async () => {
      setIsPasswordLoading(true);
      try {
        const response = await axios.get("/api/password");
        setPasswords(response.data);
      } catch (error) {
        console.error("Error fetching passwords:", error);
      } finally {
        setIsPasswordLoading(false);
      }
    };
    fetchPasswords();
  }, [refreshTrigger]);

  // Add password
  const handlePasswordManager = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (!passType || !passwordInp || !selectedColor) {
        addToast({ title: "Please fill all fields", color: "danger" });
        return;
      }
      setIsAdding(true);
      const payload = {
        type: passType,
        password: passwordInp,
        color: selectedColor,
      };
      const response = await axios.post("/api/password/adding", payload);
      if (response.status === 201) {
        setPassType("");
        setPasswordInp("");
        setSelectedColor("default");
        setRefreshTrigger((prev) => prev + 1);
        addToast({ title: "Password added successfully!", color: "success" });
      }
    } catch (error) {
      console.error("Error saving password:", error);
      addToast({ title: "Failed to save password", color: "danger" });
    } finally {
      setIsAdding(false);
    }
  };

  // Delete password (called after confirmation)
  const handleDeletePassword = async (id: string) => {
    setShowDeleteModal(false);
    setDeletingId(id);
    try {
      await axios.delete(`/api/password/${id}`);
      setPasswords((prev) => prev.filter((password) => password.id !== id));
      addToast({ title: "Password deleted successfully!", color: "success" });
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error deleting password:", error);
      addToast({ title: "Failed to delete password", color: "danger" });
    } finally {
      setDeletingId(null);
      setPendingDeleteId(null);
    }
  };

  // Color utility
  const getColorClass = (color: Color): string => {
    const colorClasses = {
      default: "#6B7280",
      primary: "#3B82F6",
      secondary: "#8B5CF6",
      success: "#10B981",
      warning: "#F59E0B",
      danger: "#EF4444",
    };
    return colorClasses[color ?? "default"] ?? colorClasses.default;
  };

  return (
    <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Add Password Form */}
      <div className="lg:col-span-1">
        <Card className="border border-default-200 bg-default-50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex gap-3">
            <LockKeyholeOpenIcon className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Insert Your Password</h2>
          </CardHeader>
          <CardBody>
            <Form className="w-full max-w-xs" onSubmit={handlePasswordManager}>
              <Input
                isRequired
                label="Type"
                labelPlacement="outside"
                name="type"
                onChange={(e) => setPassType(e.target.value)}
                value={passType}
                placeholder="Google, Facebook, Twitter, etc."
                type="text"
              />
              <Input
                isRequired
                label="Password"
                labelPlacement="outside"
                name="password"
                value={passwordInp}
                onChange={(e) => setPasswordInp(e.target.value)}
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                startContent={
                  <LockKeyholeOpenIcon className="h-4 w-4 text-default-500" />
                }
                endContent={
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onClick={() => setShowPassword((prev) => !prev)}
                    type="button"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-default-500" />
                    ) : (
                      <Eye className="h-4 w-4 text-default-500" />
                    )}
                  </Button>
                }
              />
              <RadioGroup
                label="Selection color"
                orientation="horizontal"
                value={selectedColor}
                onValueChange={setSelectedColor}
                defaultValue={colors[0]}
              >
                {colors.map((color) => (
                  <Radio
                    key={color}
                    className="capitalize"
                    color={color}
                    value={color}
                  >
                    <Badge color={color} variant="solid" size="sm">
                      &nbsp;
                    </Badge>
                  </Radio>
                ))}
              </RadioGroup>
              <Button
                type="submit"
                variant="bordered"
                isDisabled={isAdding}
                className="mt-2"
              >
                {isAdding ? (
                  <span className="flex items-center gap-2">
                    <Spinner size="sm" /> Uploading...
                  </span>
                ) : (
                  "Submit"
                )}
              </Button>
            </Form>
          </CardBody>
        </Card>
      </div>

      {/* Passwords Table */}
      <div className="lg:col-span-2">
        <Card className="border border-default-200 bg-default-50 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Your Passwords</h2>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col gap-3">
              {isPasswordLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Spinner size="lg" />
                </div>
              ) : (
                <Table aria-label="Password Table" selectionMode="single">
                  <TableHeader>
                    <TableColumn>TYPE</TableColumn>
                    <TableColumn>PASSWORD</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {passwords.map((item) => (
                      <TableRow
                        key={item.id}
                        className={`bg-[${getColorClass(item.color as Color)}]`}
                      >
                        <TableCell>
                          <Snippet hideCopyButton color={item.color as Color}>
                            {item.type?.toUpperCase()}
                          </Snippet>
                        </TableCell>
                        <TableCell>
                          <Snippet color={item.color as Color}>
                            {item.password}
                          </Snippet>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="bordered"
                              onClick={() => {
                                setEditingPasswordId(item.id);
                                onOpen();
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="bordered"
                              color="danger"
                              isDisabled={deletingId === item.id}
                              onClick={() => {
                                setPendingDeleteId(item.id);
                                setShowDeleteModal(true);
                              }}
                            >
                              {deletingId === item.id ? (
                                <Spinner size="sm" />
                              ) : (
                                "Delete"
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {isOpen && (
                <EditPasswordForm
                  isOpen={isOpen}
                  onOpenChange={onOpenChange}
                  passwordId={editingPasswordId}
                  onEditSuccess={() => setRefreshTrigger((prev) => prev + 1)}
                />
              )}
              {/* Confirmation Modal for Delete */}
              <ConfirmationModal
                isOpen={showDeleteModal}
                onOpenChange={setShowDeleteModal}
                title="Delete Password"
                description="Are you sure you want to delete this password? This action cannot be undone."
                icon={Trash}
                iconColor="text-danger"
                confirmText={
                  deletingId === pendingDeleteId ? (
                    <span className="flex items-center gap-2">
                      <Spinner size="sm" /> Deleting...
                    </span>
                  ) : (
                    "Delete"
                  )
                }
                confirmColor="danger"
                onConfirm={() => {
                  if (pendingDeleteId) {
                    handleDeletePassword(pendingDeleteId);
                  }
                }}
                isDangerous
                warningMessage="This password will be permanently deleted."
                cancelText="Cancel"
                isLoading={deletingId === pendingDeleteId}
                isDisabled={deletingId === pendingDeleteId}
              />
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}