'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function DonatePaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'processing' | 'error'>('processing');

  useEffect(() => {
    const processCallback = async () => {
      try {
        const merchantOrderId = searchParams.get('merchantOrderId');
        
        if (!merchantOrderId) {
          console.error('No merchantOrderId in callback');
          router.push('/donate/payment-failed?error=no_transaction_id');
          return;
        }

        console.log('Processing donation payment callback:', merchantOrderId);

        // Call the API to process the payment
        const response = await fetch('/api/payment/donate/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            merchantOrderId,
            from: 'phonepe',
          }),
        });

        const result = await response.json();

        if (result.success) {
          // Redirect to success page
          router.push(`/donate/success?donation_id=${result.donation_id}`);
        } else {
          // Redirect to failure page
          router.push(`/donate/payment-failed?transaction=${merchantOrderId}&error=${result.error || 'unknown'}`);
        }
      } catch (error) {
        console.error('Error processing payment callback:', error);
        setStatus('error');
        setTimeout(() => {
          router.push('/donate/payment-failed?error=callback_processing_failed');
        }, 2000);
      }
    };

    processCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-4 p-8">
        {status === 'processing' ? (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-purple-600 dark:text-purple-400 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Processing Your Donation
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Please wait while we confirm your payment...
            </p>
          </>
        ) : (
          <>
            <div className="text-red-600 dark:text-red-400 text-4xl mb-4">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Processing Error
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Redirecting to error page...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function DonatePaymentCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
          <div className="text-center space-y-4 p-8">
            <Loader2 className="w-16 h-16 animate-spin text-purple-600 dark:text-purple-400 mx-auto" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Loading...
            </h1>
          </div>
        </div>
      }
    >
      <DonatePaymentCallbackContent />
    </Suspense>
  );
}
