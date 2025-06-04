"use client";
import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Button,
  Input,
  Radio,
  RadioGroup,
} from "@heroui/react";
import { addToast } from "@heroui/react";
import CryptoJS from "crypto-js";

interface PasswordManagerAuthProps {
  isOpen: boolean;
  onUnlock: () => void;
  onClose: () => void;
}

type PasswordType = "pin" | "password";

export default function PasswordManagerAuth({
  isOpen,
  onUnlock,
  onClose,
}: PasswordManagerAuthProps) {
  const [mode, setMode] = useState<"set" | "unlock">("set");
  const [passwordType, setPasswordType] = useState<PasswordType>("pin");
  const [pin, setPin] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [confirmResetInput, setConfirmResetInput] = useState("");

  const secretKey = process.env.NEXT_PUBLIC_SECRET_KEY as string;

  const encryptData = (data: { type: string; password: string }): string => {
    const json = JSON.stringify(data);
    return CryptoJS.AES.encrypt(json, secretKey).toString();
  };

  const decryptData = (
    ciphertext: string
  ): { type: string; password: string } | null => {
    try {
      const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
      const decrypted = bytes.toString(CryptoJS.enc.Utf8);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  };

  const fetchEncrypted = async (): Promise<{
    authPassword: string | null;
    authType: PasswordType | null;
  }> => {
    const res = await fetch("/api/password/auth-password");
    const data = await res.json();
    return {
      authPassword: data.authPassword || null,
      authType: data.authType || null,
    };
  };

  const setEncrypted = async (encryptedValue: string, type: PasswordType) => {
    await fetch("/api/password/auth-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authType: type, authPassword: encryptedValue }),
    });
  };

  const handleSetPassword = async () => {
    if (passwordType === "pin" && pin.length !== 4) {
      addToast({ title: "PIN must be exactly 4 digits", color: "danger" });
      return;
    }
    if (passwordType === "password" && password.length < 4) {
      addToast({
        title: "Password must be at least 4 characters",
        color: "danger",
      });
      return;
    }

    try {
      const encryptedValue = encryptData({
        type: passwordType,
        password: passwordType === "pin" ? pin : password,
      });
      await setEncrypted(encryptedValue, passwordType);

      addToast({ title: "Password set successfully!", color: "success" });
      setMode("unlock");
      setPin("");
      setPassword("");
    } catch (error) {
      console.error("Encryption failed:", error);
      addToast({ title: "Failed to set password", color: "danger" });
    }
  };

  const handleUnlock = async () => {
    setAuthLoading(true);
    setTimeout(async () => {
      try {
        const { authPassword, authType } = await fetchEncrypted();

        if (!authPassword || !authType) {
          addToast({ title: "Password not set", color: "danger" });
          setAuthLoading(false);
          return;
        }

        const storedValue = decryptData(authPassword);
        const inputValue = authType === "pin" ? pin : password;

        if (storedValue && inputValue === storedValue.password) {
          onUnlock();
          setPin("");
          setPassword("");
        } else {
          addToast({ title: "Incorrect password", color: "danger" });
          setPin("");
          setPassword("");
        }
      } catch (error) {
        console.error("Decryption failed:", error);
        addToast({ title: "Authentication failed", color: "danger" });
      }
      setAuthLoading(false);
    }, 400);
  };

  const handleConfirmReset = async () => {
    setAuthLoading(true);
    try {
      const res = await fetch("/api/verify-clerk-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: confirmResetInput }),
      });
      const data = await res.json();
      if (data.success) {
        await setEncrypted("", "pin");
        setMode("set");
        setPin("");
        setPassword("");
        setPasswordType("pin");
        setShowConfirmReset(false);
        setConfirmResetInput("");
        addToast({
          title: "Password reset! Please set a new password.",
          color: "success",
        });
      } else {
        addToast({ title: "Wrong credentials", color: "danger" });
        setConfirmResetInput("");
      }
    } catch (err) {
      addToast({ title: "Something went wrong", color: "danger" });
    }
    setAuthLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchEncrypted().then(({ authPassword, authType }) => {
        setMode(authPassword ? "unlock" : "set");
        setPasswordType(authType || "pin");
      });
      setPin("");
      setPassword("");
      setShowConfirmReset(false);
      setConfirmResetInput("");
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          setShowConfirmReset(false);
          setConfirmResetInput("");
          setPin("");
          setPassword("");
          setPasswordType("pin");
          onClose();
        }
      }}
    >
      <ModalContent>
        <ModalHeader>
          {mode === "set"
            ? "Set Your Password"
            : showConfirmReset
              ? "Confirm Reset"
              : "Enter Password to Unlock"}
        </ModalHeader>
        <ModalBody>
          {showConfirmReset ? (
            <>
              <Input
                label="Enter your account password"
                type="password"
                value={confirmResetInput}
                onChange={(e) => setConfirmResetInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirmReset();
                }}
                autoFocus
              />
              <Button
                color="danger"
                className="mt-4 w-full"
                onPress={handleConfirmReset}
                isDisabled={confirmResetInput.length < 4 || authLoading}
              >
                {authLoading ? "Checking..." : "Confirm Reset"}
              </Button>
              <Button
                color="default"
                variant="light"
                className="mt-2 w-full"
                onPress={() => {
                  setShowConfirmReset(false);
                  setConfirmResetInput("");
                }}
                isDisabled={authLoading}
              >
                Cancel
              </Button>
            </>
          ) : mode === "set" ? (
            <>
              <RadioGroup
                label="Choose password type"
                orientation="horizontal"
                value={passwordType}
                onValueChange={(val) => setPasswordType(val as PasswordType)}
              >
                <Radio value="pin">PIN (Numbers Only)</Radio>
                <Radio value="password">Password (Alphanumeric)</Radio>
              </RadioGroup>
              {passwordType === "pin" ? (
                <>
                  <Input
                    label="Set PIN"
                    type="password"
                    value={pin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setPin(val.slice(0, 4));
                    }}
                    maxLength={4}
                  />
                  <div className="grid grid-cols-3 gap-2 my-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => (
                      <Button
                        key={n}
                        onPress={() =>
                          setPin((prev) => (prev.length < 4 ? prev + n : prev))
                        }
                        isDisabled={pin.length >= 4}
                        className="text-lg"
                      >
                        {n}
                      </Button>
                    ))}
                    <Button
                      onPress={() => setPin(pin.slice(0, -1))}
                      color="danger"
                    >
                      ⌫
                    </Button>
                  </div>
                </>
              ) : (
                <Input
                  label="Set Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              )}
              <Button
                color="primary"
                className="mt-4 w-full"
                onPress={handleSetPassword}
                isDisabled={
                  (passwordType === "pin" && pin.length !== 4) ||
                  (passwordType === "password" && password.length < 4)
                }
              >
                Set Password
              </Button>
            </>
          ) : (
            <>
              <div className="mb-2 font-medium">
                {passwordType === "pin" ? "PIN" : "Password"}
              </div>
              {passwordType === "pin" ? (
                <>
                  <Input
                    label="Enter PIN"
                    type="password"
                    value={pin}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setPin(val.slice(0, 4));
                    }}
                    maxLength={4}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUnlock();
                    }}
                    autoFocus
                  />
                  <div className="grid grid-cols-3 gap-2 my-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n) => (
                      <Button
                        key={n}
                        onPress={() =>
                          setPin((prev) => (prev.length < 4 ? prev + n : prev))
                        }
                        isDisabled={pin.length >= 4}
                        className="text-lg"
                      >
                        {n}
                      </Button>
                    ))}
                    <Button
                      onPress={() => setPin(pin.slice(0, -1))}
                      color="danger"
                    >
                      ⌫
                    </Button>
                  </div>
                </>
              ) : (
                <Input
                  label="Enter Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleUnlock();
                  }}
                  autoFocus
                />
              )}
              <Button
                color="primary"
                className="mt-4 w-full"
                onPress={handleUnlock}
                isDisabled={
                  authLoading ||
                  (passwordType === "pin"
                    ? pin.length !== 4
                    : password.length < 4)
                }
              >
                {authLoading ? "Checking..." : "Unlock"}
              </Button>
              <Button
                color="danger"
                variant="light"
                className="mt-2 w-full"
                onPress={() => setShowConfirmReset(true)}
                isDisabled={authLoading}
              >
                Reset Password
              </Button>
            </>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
