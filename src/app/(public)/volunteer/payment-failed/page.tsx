'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, RefreshCw, Home, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Suspense } from 'react';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const transactionId = searchParams.get('transaction');
  const status = searchParams.get('status');
  const error = searchParams.get('error');

  const getErrorMessage = () => {
    if (error === 'pending_not_found') {
      return 'Registration data not found. Please try registering again.';
    }
    if (error === 'no_response') {
      return 'No response received from payment gateway.';
    }
    if (error === 'no_transaction_id') {
      return 'Transaction ID missing from payment response.';
    }
    if (error === 'processing_failed') {
      return 'Failed to process payment. Please contact support.';
    }
    if (status === 'PAYMENT_DECLINED') {
      return 'Payment was declined by your bank. Please try again with a different payment method.';
    }
    if (status === 'PAYMENT_CANCELLED') {
      return 'Payment was cancelled. Please try again.';
    }
    return 'Payment could not be completed. Please try again.';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full shadow-2xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-r from-red-400 to-orange-500 flex items-center justify-center mb-4">
            <XCircle className="w-12 h-12 text-white" />
          </div>
          <CardTitle className="text-2xl text-red-600 dark:text-red-400">
            Payment Failed
          </CardTitle>
          <CardDescription>
            Your volunteer registration could not be completed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Message */}
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">
                {getErrorMessage()}
              </p>
            </div>
          </div>

          {/* Transaction Details */}
          {transactionId && (
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <span className="font-medium">Transaction ID:</span>{' '}
                <span className="font-mono text-xs">{transactionId}</span>
              </p>
            </div>
          )}

          {/* Help Text */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <strong>Need help?</strong> If your amount was deducted, please contact us with your transaction ID. Refunds are processed within 5-7 business days.
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Link href="/volunteer" className="w-full">
              <Button className="w-full" variant="default">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </Link>
            <Link href="/" className="w-full">
              <Button className="w-full" variant="outline">
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

export default function VolunteerPaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}
