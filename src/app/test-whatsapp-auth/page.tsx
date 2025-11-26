// / Test WhatsApp Authentication - Now with Meta Approval! 🎉
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OTPVerificationModal } from "@/components/auth/OTPVerificationModal";
import { Loader2, MessageSquare, Phone, CheckCircle2, XCircle } from "lucide-react";

export default function TestWhatsAppAuthPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [messageId, setMessageId] = useState<string | null>(null);
  const [devOTP, setDevOTP] = useState<string | null>(null);

  const handleSendWhatsAppOTP = async () => {
    setIsSending(true);
    setError(null);
    setMessageId(null);
    setDevOTP(null);

    try {
      // Format phone number
      const formattedPhone = phoneNumber.startsWith("+91")
        ? phoneNumber
        : `+91${phoneNumber}`;

      console.log("📱 Sending WhatsApp OTP to:", formattedPhone);

      const response = await fetch("/api/auth/send-otp-whatsapp-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone_number: formattedPhone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      console.log("✅ WhatsApp OTP sent successfully:", data);
      
      // Store message ID and dev OTP
      if (data.message_id) {
        setMessageId(data.message_id);
      }
      if (data.otp_dev_only) {
        setDevOTP(data.otp_dev_only);
        console.log("🔑 OTP (DEV MODE):", data.otp_dev_only);
      }

      setShowOTPModal(true);
    } catch (err) {
      console.error("❌ Error:", err);
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setIsSending(false);
    }
  };

  const handleVerificationSuccess = () => {
    console.log("🎉 WhatsApp verification successful!");
    setShowOTPModal(false);
    setSuccess(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-linear-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="h-6 w-6 text-green-600" />
            <CardTitle className="text-2xl">Test WhatsApp Authentication</CardTitle>
          </div>
          <CardDescription>
            Test OTP delivery via WhatsApp Business API with approved templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {success ? (
            <div className="text-center space-y-4 py-8">
              <div className="flex justify-center">
                <CheckCircle2 className="h-20 w-20 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-green-600 dark:text-green-400">
                WhatsApp Authentication Successful!
              </h3>
              <p className="text-muted-foreground">
                Your phone number has been verified via WhatsApp and you are now authenticated.
              </p>
              {messageId && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                  <p className="text-xs text-green-800 dark:text-green-200">
                    <strong>Message ID:</strong> {messageId}
                  </p>
                </div>
              )}
              <Button
                onClick={() => {
                  setSuccess(false);
                  setPhoneNumber("");
                  setMessageId(null);
                  setDevOTP(null);
                }}
                variant="outline"
              >
                Test Again
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Phone Number (Indian)
                </label>
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    placeholder="9876543210"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    maxLength={10}
                    className="text-lg"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Enter 10-digit Indian mobile number (starts with 6-9)
                </p>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-5 w-5 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <p className="font-semibold">Error sending WhatsApp OTP</p>
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {devOTP && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    <strong>🔑 DEV MODE OTP:</strong> <span className="font-mono text-lg font-bold">{devOTP}</span>
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Button
                  onClick={handleSendWhatsAppOTP}
                  disabled={phoneNumber.length !== 10 || isSending}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Sending via WhatsApp...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-5 w-5" />
                      Send WhatsApp OTP
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Using WhatsApp Business API with approved template
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  How WhatsApp OTP works:
                </h4>
                <ol className="text-xs space-y-1 text-muted-foreground">
                  <li>1. Enter your WhatsApp-enabled phone number</li>
                  <li>2. Click &quot;Send WhatsApp OTP&quot;</li>
                  <li>3. Receive 6-digit code via WhatsApp message</li>
                  <li>4. Enter code to verify</li>
                  <li>5. Get authenticated with Firebase ✅</li>
                </ol>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg space-y-2">
                <h4 className="font-semibold text-sm">✨ WhatsApp Template Features:</h4>
                <ul className="text-xs space-y-1 text-muted-foreground">
                  <li>• Meta-approved authentication template</li>
                  <li>• Zero-tap autofill support (Android)</li>
                  <li>• One-time password delivery</li>
                  <li>• 5-minute OTP validity</li>
                  <li>• Secure bcrypt hashing</li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-lg">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Note:</strong> Make sure you have WhatsApp installed and the number is registered with WhatsApp.
                  The message will be sent to your WhatsApp account.
                </p>
              </div>

              {messageId && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                  <p className="text-xs text-green-800 dark:text-green-200">
                    <strong>✅ Message Sent!</strong>
                    <br />
                    Message ID: <span className="font-mono">{messageId}</span>
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <OTPVerificationModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        phoneNumber={phoneNumber.startsWith("+91") ? phoneNumber : `+91${phoneNumber}`}
        onVerificationSuccess={handleVerificationSuccess}
        initialMethod="whatsapp"
      />
    </div>
  );
}
