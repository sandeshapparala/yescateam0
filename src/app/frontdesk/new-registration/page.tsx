// Frontdesk New Registration Page
// Opens Sheet for registration form, no phone verification needed
// Handles Normal and Faithbox registrations using reusable component
'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { FrontdeskRegistrationSheet, RegistrationType } from '@/components/frontdesk/FrontdeskRegistrationSheet';

function NewRegistrationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get initial type from URL (only normal/faithbox)
  const urlType = searchParams.get('type');
  const initialType: RegistrationType = 
    urlType === 'faithbox' ? 'faithbox' : 'normal';
  
  const [sheetOpen, setSheetOpen] = useState(true);

  // Handle sheet close - navigate back to registrations
  const handleOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setTimeout(() => router.push('/frontdesk/registrations'), 200);
    }
  };

  return (
    <div className="px-5 lg:px-8 mt-16 lg:mt-0 pb-8">
      {/* Back button */}
      <button
        onClick={() => router.push('/frontdesk/registrations')}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to Registrations
      </button>

      {/* Use the reusable registration sheet component */}
      <FrontdeskRegistrationSheet
        open={sheetOpen}
        onOpenChange={handleOpenChange}
        initialType={initialType}
      />
    </div>
  );
}

export default function NewRegistrationPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    }>
      <NewRegistrationContent />
    </Suspense>
  );
}
