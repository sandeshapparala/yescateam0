// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */

 // OTP Verification Modal Component
"use client";

import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Smartphone, MessageSquare } from "lucide-react";
import { auth } from "@/lib/firebase/config";
import { signInWithCustomToken } from "firebase/auth";
import {
  initializeRecaptcha,
  sendFirebasePhoneOTP,
  verifyFirebaseSMSCode,
  cleanupRecaptcha,
} from "@/lib/auth/firebase-phone-auth";

interface OTPVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  onVerificationSuccess: () => void;
  initialMethod?: "whatsapp" | "sms"; // Optional: default method for OTP verification
}

export function OTPVerificationModal({
  isOpen,
  onClose,
  phoneNumber,
  onVerificationSuccess,
  initialMethod = "whatsapp", // Default to WhatsApp (primary method)
}: OTPVerificationModalProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes for OTP expiry
  const [resendTimeLeft, setResendTimeLeft] = useState(60); // 1 minute for resend cooldown
  const [canResend, setCanResend] = useState(false);
  const [method, setMethod] = useState<"whatsapp" | "sms">(initialMethod);
  const [isWaitingForFirebaseSMS, setIsWaitingForFirebaseSMS] = useState(initialMethod === "sms");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [hasInitializedWhatsApp, setHasInitializedWhatsApp] = useState(false);

  // Auto-send WhatsApp OTP when modal opens (WhatsApp is now primary)
  useEffect(() => {
    if (isOpen && method === "whatsapp" && !hasInitializedWhatsApp && !isSending) {
      setHasInitializedWhatsApp(true);
      handleSendWhatsAppOTP();
    }
    
    // Reset state when modal closes
    if (!isOpen) {
      setHasInitializedWhatsApp(false);
      setOtp(["", "", "", "", "", ""]);
      setError(null);
      setIsVerifying(false);
      setIsSending(false);
      setMethod(initialMethod); // Reset to initial method
      setIsWaitingForFirebaseSMS(initialMethod === "sms");
      cleanupRecaptcha();
    }
  }, [isOpen, initialMethod]);

  // Timer countdown for OTP expiry
  useEffect(() => {
    if (!isOpen || timeLeft === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, timeLeft]);

  // Timer countdown for resend cooldown
  useEffect(() => {
    if (!isOpen || resendTimeLeft === 0) return;

    const timer = setInterval(() => {
      setResendTimeLeft((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, resendTimeLeft]);

  // Cleanup reCAPTCHA on unmount
  useEffect(() => {
    return () => {
      cleanupRecaptcha();
      setHasInitializedWhatsApp(false);
    };
  }, []);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle OTP input
  const handleOTPChange = (index: number, value: string) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOTP = [...otp];
    newOTP[index] = value.slice(-1); // Take only last character
    setOtp(newOTP);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (index === 5 && value && newOTP.every((digit) => digit)) {
      handleVerifyOTP(newOTP.join(""));
    }
  };

  // Handle backspace
  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOTP = pastedData.split("").concat(Array(6).fill("")).slice(0, 6);
    setOtp(newOTP);

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length, 5);
    inputRefs.current[lastIndex]?.focus();

    // Auto-submit if 6 digits pasted
    if (pastedData.length === 6) {
      handleVerifyOTP(pastedData);
    }
  };

  // Verify OTP
  const handleVerifyOTP = async (otpValue: string) => {
    setIsVerifying(true);
    setError(null);

    try {
      // Firebase SMS Flow - Firebase already authenticated the user
      if (method === "sms" && isWaitingForFirebaseSMS) {
        console.log('🔥 Verifying Firebase SMS code...');
        const firebaseResult = await verifyFirebaseSMSCode(otpValue);
        console.log('✅ Firebase SMS verified and user signed in!');
        setIsWaitingForFirebaseSMS(false);

        // Sync user data to Firestore (Firebase already signed user in)
        const response = await fetch("/api/auth/verify-firebase-sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone_number: phoneNumber,
            firebase_uid: firebaseResult.uid,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to sync user data");
        }

        console.log("✅ User data synced to Firestore!");

        // Cleanup
        cleanupRecaptcha();

        // Success! User is already signed in via Firebase Phone Auth
        onVerificationSuccess();
        return;
      }

      // WhatsApp OTP Flow - Verify with our backend
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_number: phoneNumber,
          otp: otpValue,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Verification failed");
      }

      // Sign in with custom token
      console.log("🔐 Signing in with custom token...");
      await signInWithCustomToken(auth, data.custom_token);
      console.log("✅ User authenticated successfully!");

      // Success!
      onVerificationSuccess();
    } catch (err) {
      console.error("OTP verification error:", err);
      setError(err instanceof Error ? err.message : "Verification failed");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  // Send WhatsApp OTP
  const handleSendWhatsAppOTP = async () => {
    setIsSending(true);
    setError(null);

    try {
      console.log('📱 Sending WhatsApp OTP...');
      const response = await fetch("/api/auth/send-otp-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send WhatsApp OTP");
      }

      console.log('✅ WhatsApp OTP sent successfully');

      // Update UI
      setMethod("whatsapp");
      setIsWaitingForFirebaseSMS(false);
      setTimeLeft(300); // 5 minutes for OTP expiry
      setResendTimeLeft(60); // 1 minute for resend cooldown
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error('WhatsApp OTP error:', err);
      setError(err instanceof Error ? err.message : "Failed to send WhatsApp OTP");
    } finally {
      setIsSending(false);
    }
  };

  // Resend OTP (based on current method)
  const handleResend = async () => {
    if (method === "whatsapp") {
      await handleSendWhatsAppOTP();
    } else {
      await handleSwitchToSMS();
    }
  };

  // Switch to SMS using Firebase Phone Auth
  const handleSwitchToSMS = async () => {
    setIsSending(true);
    setError(null);

    try {
      // Step 1: Call our backend to store OTP
      const response = await fetch("/api/auth/send-otp-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to prepare SMS OTP");
      }

      // Step 2: Initialize Firebase reCAPTCHA
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (!recaptchaContainer) {
        // Create container if it doesn't exist
        const container = document.createElement('div');
        container.id = 'recaptcha-container';
        document.body.appendChild(container);
      }

      initializeRecaptcha(
        'recaptcha-container',
        () => console.log('reCAPTCHA verified'),
        (error) => {
          console.error('reCAPTCHA error:', error);
          setError('reCAPTCHA verification failed');
        }
      );

      // Step 3: Send SMS via Firebase
      console.log('🔥 Sending Firebase Phone Auth SMS...');
      await sendFirebasePhoneOTP(phoneNumber);
      console.log('✅ Firebase SMS sent successfully');

      // Update UI
      setMethod("sms");
      setIsWaitingForFirebaseSMS(true);
      setTimeLeft(300); // 5 minutes for OTP expiry
      setResendTimeLeft(60); // 1 minute for resend cooldown
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error('Firebase SMS error:', err);
      setError(err instanceof Error ? err.message : "Failed to send SMS OTP");
      cleanupRecaptcha();
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Verify Phone Number
          </DialogTitle>
          <DialogDescription className="text-center">
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                {method === "whatsapp" ? (
                  <>
                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    <span className="font-bold text-green-600">Check Your WhatsApp!</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-6 h-6 text-blue-600" />
                    <span className="font-bold text-blue-600">Check Your SMS!</span>
                  </>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Enter the 6-digit code sent to
                <br />
                <span className="font-semibold text-foreground">{phoneNumber}</span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* OTP Input */}
          <div className="flex justify-center gap-2" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <Input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOTPChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-12 h-12 text-center text-xl font-bold rounded-lg"
                disabled={isVerifying}
                autoFocus={index === 0}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive text-center bg-destructive/10 p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Timer */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              {timeLeft > 0 ? (
                <>
                  Code expires in{" "}
                  <span className="font-semibold text-foreground">
                    {formatTime(timeLeft)}
                  </span>
                </>
              ) : (
                <span className="text-destructive">Code expired</span>
              )}
            </p>
          </div>

          {/* Verify Button */}
          <Button
            onClick={() => handleVerifyOTP(otp.join(""))}
            disabled={otp.some((d) => !d) || isVerifying}
            className="w-full"
            size="lg"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify OTP"
            )}
          </Button>

          {/* Resend & SMS Options */}
          <div className="space-y-2">
            <Button
              variant="outline"
              onClick={handleResend}
              disabled={!canResend || isSending}
              className="w-full"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : canResend ? (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Resend OTP
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Resend in {resendTimeLeft}s
                </>
              )}
            </Button>

            {method === "whatsapp" && (
              <Button
                variant="outline"
                onClick={handleSwitchToSMS}
                disabled={isSending}
                className="w-full"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Smartphone className="mr-2 h-4 w-4" />
                    Send via SMS Instead
                  </>
                )}
              </Button>
            )}

            {method === "sms" && (
              <Button
                variant="outline"
                onClick={handleSendWhatsAppOTP}
                disabled={isSending}
                className="w-full"
              >
                {isSending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send via WhatsApp Instead
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
