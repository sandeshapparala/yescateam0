// Donation Payment Failed Page
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { XCircle, RefreshCcw, Home, HelpCircle } from "lucide-react";

function DonationFailedContent() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get("transaction");

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/20 dark:to-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Error Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full mb-6">
            <XCircle className="w-16 h-16 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Payment Failed
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            We couldn&apos;t process your donation payment
          </p>
        </div>

        {/* Error Details Card */}
        <Card className="shadow-xl mb-6">
          <CardHeader className="bg-red-50 dark:bg-red-900/20">
            <CardTitle className="text-xl text-red-600 dark:text-red-400">
              Transaction Failed
            </CardTitle>
            {transactionId && (
              <CardDescription>
                Transaction ID: {transactionId}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                Your donation payment could not be completed. This might have happened due to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-400">
                <li>Insufficient balance in your account</li>
                <li>Payment gateway timeout</li>
                <li>Payment cancelled by user</li>
                <li>Bank declined the transaction</li>
                <li>Network connectivity issues</li>
              </ul>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg mt-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  <strong>Don&apos;t worry!</strong> No amount has been deducted from your account. You can try donating again.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Link href="/donate" className="block">
            <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" size="lg">
              <RefreshCcw className="mr-2 h-5 w-5" />
              Try Again
            </Button>
          </Link>
          
          <Link href="/" className="block">
            <Button variant="outline" className="w-full" size="lg">
              <Home className="mr-2 h-5 w-5" />
              Return to Home
            </Button>
          </Link>
        </div>

        {/* Help Card */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              If you continue to face issues with payment, please contact our support team:
            </p>
            <div className="space-y-2 text-sm">
              <div>
                <strong>Email:</strong>{" "}
                <a href="mailto:support@yesca.org" className="text-blue-600 hover:underline">
                  support@yesca.org
                </a>
              </div>
              <div>
                <strong>Phone:</strong>{" "}
                <a href="tel:+919876543210" className="text-blue-600 hover:underline">
                  +91 98765 43210
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DonationFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-red-900/20 dark:to-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-300">Loading...</p>
          </div>
        </div>
      }
    >
      <DonationFailedContent />
    </Suspense>
  );
}
