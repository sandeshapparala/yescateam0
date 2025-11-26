// Frontdesk Payment Callback Page
// Handles redirect from PhonePe after payment
// Shows success/failure status and redirects to registrations
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle, ArrowRight, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FrontdeskPaymentCallbackPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [details, setDetails] = useState<{
    memberId?: string;
    registrationId?: string;
    regNumber?: string;
    transaction?: string;
    error?: string;
    reason?: string;
  }>({});

  useEffect(() => {
    const statusParam = searchParams.get('status');
    const error = searchParams.get('error');
    
    if (statusParam === 'success') {
      setStatus('success');
      setDetails({
        memberId: searchParams.get('member_id') || undefined,
        registrationId: searchParams.get('registration_id') || undefined,
        regNumber: searchParams.get('reg_number') || undefined,
        transaction: searchParams.get('transaction') || undefined,
      });
    } else if (statusParam === 'failed' || error) {
      setStatus('failed');
      setDetails({
        error: error || undefined,
        reason: searchParams.get('reason') || undefined,
        transaction: searchParams.get('transaction') || undefined,
      });
    } else {
      // Still loading or checking status
      // If we have merchantOrderId but no status, payment might still be processing
      const merchantOrderId = searchParams.get('merchantOrderId');
      if (merchantOrderId) {
        // Check payment status
        checkPaymentStatus(merchantOrderId);
      } else {
        setStatus('failed');
        setDetails({ error: 'Invalid callback' });
      }
    }
  }, [searchParams]);

  const checkPaymentStatus = async (transactionId: string) => {
    try {
      const response = await fetch(`/api/frontdesk/payment/callback?transaction_id=${transactionId}`);
      const data = await response.json();
      
      if (data.code === 'PAYMENT_SUCCESS' || data.success) {
        // Payment successful but callback hasn't processed yet
        // Wait and reload
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setStatus('failed');
        setDetails({
          error: 'Payment not completed',
          reason: data.code || 'Unknown',
          transaction: transactionId,
        });
      }
    } catch (err) {
      console.error('Error checking payment status:', err);
      setStatus('failed');
      setDetails({
        error: 'Failed to check payment status',
        transaction: transactionId,
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Loading State */}
        {status === 'loading' && (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader2 className="w-8 h-8 text-gray-600 animate-spin" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Processing Payment</h1>
            <p className="text-sm text-gray-500">Please wait while we confirm your payment...</p>
          </div>
        )}

        {/* Success State */}
        {status === 'success' && (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-sm text-gray-500 mb-6">Registration completed successfully</p>
            
            {/* Registration Details */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase mb-1">Member ID</p>
                  <p className="text-sm font-bold text-gray-900 font-mono">{details.memberId}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase mb-1">Reg #</p>
                  <p className="text-sm font-bold text-emerald-600">#{details.regNumber}</p>
                </div>
              </div>
              {details.registrationId && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <p className="text-[10px] text-gray-400 uppercase mb-1">Registration ID</p>
                  <p className="text-xs font-mono text-gray-600">{details.registrationId}</p>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => router.push('/frontdesk/registrations')}
                className="w-full bg-gray-900 hover:bg-gray-800"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Go to Registrations
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push(`/frontdesk/registrations?search=${details.memberId}`)}
                className="w-full"
              >
                <Printer className="w-4 h-4 mr-2" />
                Print ID Card
              </Button>
            </div>
          </div>
        )}

        {/* Failed State */}
        {status === 'failed' && (
          <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-sm text-gray-500 mb-6">
              {details.error || details.reason || 'Payment could not be completed'}
            </p>
            
            {/* Error Details */}
            {(details.transaction || details.reason) && (
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left text-sm">
                {details.transaction && (
                  <div className="mb-2">
                    <span className="text-gray-500">Transaction:</span>{' '}
                    <span className="font-mono text-gray-700">{details.transaction}</span>
                  </div>
                )}
                {details.reason && (
                  <div>
                    <span className="text-gray-500">Reason:</span>{' '}
                    <span className="text-gray-700">{details.reason}</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Actions */}
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => router.push('/frontdesk/registrations')}
                className="w-full bg-gray-900 hover:bg-gray-800"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Back to Registrations
              </Button>
              <Button
                variant="outline"
                onClick={() => router.push('/frontdesk/new-registration')}
                className="w-full"
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
