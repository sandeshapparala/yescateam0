'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Home, User, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense } from 'react';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const volunteerId = searchParams.get('volunteer_id');
  const transactionId = searchParams.get('transaction');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center mb-4 animate-bounce">
            <CheckCircle2 className="w-12 h-12 text-white" />
          </div>
          <CardTitle className="text-2xl text-green-600 dark:text-green-400">
            Registration Successful!
          </CardTitle>
          <CardDescription>
            Thank you for registering as a volunteer for YC26
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Details */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 space-y-3">
            {volunteerId && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <User className="w-4 h-4" />
                  <span>Volunteer ID</span>
                </div>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {volunteerId}
                </span>
              </div>
            )}
            {transactionId && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Receipt className="w-4 h-4" />
                  <span>Transaction ID</span>
                </div>
                <span className="font-mono text-xs text-gray-900 dark:text-white truncate max-w-[150px]">
                  {transactionId}
                </span>
              </div>
            )}
          </div>

          {/* Important Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Important:</strong> Please save your Volunteer ID. You will need it during check-in at the camp.
            </p>
          </div>

          {/* WhatsApp notification */}
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-300">
              A confirmation message has been sent to your WhatsApp number.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="w-full">
              <Button className="w-full" variant="default">
                <Home className="w-4 h-4 mr-2" />
                Go to Home
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VolunteerPaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
