"use client";

import { Input } from "@heroui/input";
import {
  Badge,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Radio,
  RadioGroup,
  Spinner,
  useDisclosure,
} from "@heroui/react";
import axios from "axios";
import { useState, useEffect } from "react";

interface IPasswordManager {
  id: string;
  type: string;
  password: string;
  color: string;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface EditPasswordFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  passwordId: string | null;
  onEditSuccess: () => void;
}

export default function EditPasswordForm({
  isOpen,
  onOpenChange,
  passwordId,
  onEditSuccess,
}: EditPasswordFormProps) {
  const [editedType, setEditedType] = useState("");
  const [editedPassword, setEditedPassword] = useState("");
  const [selectedColor, setSelectedColor] = useState("default");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const colors = [
    "default",
    "primary",
    "secondary",
    "success",
    "warning",
    "danger",
  ] as const;

  // Fetch password data when modal opens or passwordId changes
  useEffect(() => {
    const fetchPasswordData = async () => {
      if (!passwordId) {
        setError("Invalid password ID");
        return;
      }

      try {
        setIsLoading(true);
        setError("");

        const response = await axios.get(`/api/password/${passwordId}`);
        const passwordData = response.data;

        setEditedType(passwordData.type);
        setEditedPassword(passwordData.password);
        setSelectedColor(passwordData.color);
      } catch (err) {
        console.error("Error fetching password:", err);
        setError("Failed to load password data");
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen && passwordId) {
      fetchPasswordData();
    }
  }, [isOpen, passwordId]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEditedType("");
      setEditedPassword("");
      setSelectedColor("default");
      setError("");
    }
  }, [isOpen]);

  const handleSaveChanges = async () => {
    if (!passwordId) {
      setError("Invalid password ID");
      return;
    }

    if (!editedType || !editedPassword || !selectedColor) {
      setError("Please fill all fields");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const updatedPassword = {
        type: editedType,
        password: editedPassword,
        color: selectedColor,
      };

      await axios.patch(`/api/password/${passwordId}`, updatedPassword);

      // Notify parent component about successful edit
      onEditSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error("Error updating password:", err);
      setError("Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>Edit Password</ModalHeader>
            <ModalBody>
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <Spinner size="lg" />
                </div>
              ) : error ? (
                <div className="text-danger p-2 rounded bg-danger-50 mb-4">
                  {error}
                </div>
              ) : (
                <>
                  <Input
                    label="Type"
                    value={editedType}
                    onChange={(e) => setEditedType(e.target.value)}
                    isDisabled={isLoading}
                    className="mb-4"
                  />
                  <Input
                    label="Password"
                    value={editedPassword}
                    onChange={(e) => setEditedPassword(e.target.value)}
                    isDisabled={isLoading}
                    className="mb-4"
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
                        color={color}
                        value={color}
                        aria-label={color}
                        className="w-7 h-7 mx-2" // thoda bada radio dikhane ke liye, koi border class nahi
                      />
                    ))}
                  </RadioGroup>
                </>
              )}
            </ModalBody>
            <ModalFooter>
              <div className="flex justify-end gap-2">
                <Button
                  color="default"
                  variant="light"
                  onPress={onClose}
                  isDisabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  onPress={handleSaveChanges}
                  isDisabled={
                    isLoading ||
                    !editedType ||
                    !editedPassword ||
                    !selectedColor
                  }
                >
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
