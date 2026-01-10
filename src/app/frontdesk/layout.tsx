// Frontdesk Layout with Authentication
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { FrontdeskSidebar } from '@/components/frontdesk/FrontdeskSidebar';
import { Loader2 } from 'lucide-react';

function FrontdeskLayoutContent({ children }: { children: React.ReactNode }) {
  const { user, role, loading, isFrontDesk, isAdmin, isSuperAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Not logged in - redirect to admin login
      if (!user) {
        router.push('/admin/login');
        return;
      }

      // Check if user has frontdesk, admin, or super_admin role
      const hasAccess = isFrontDesk || isAdmin || isSuperAdmin;
      if (!hasAccess) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [user, role, loading, isFrontDesk, isAdmin, isSuperAdmin, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-red-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authorized
  if (!user || (!isFrontDesk && !isAdmin && !isSuperAdmin)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <FrontdeskSidebar />
      <div className="lg:pl-[72px]">
        <main className="py-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function FrontdeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <FrontdeskLayoutContent>{children}</FrontdeskLayoutContent>
    </AuthProvider>
  );
}
