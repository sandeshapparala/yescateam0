// Frontdesk Sidebar Component - Narrow/Collapsed Style with Icons + Labels Below
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  LayoutDashboard,
  ClipboardList,
  UserPlus,
  Search,
  Menu,
  X,
  LogOut,
  Users,
} from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/frontdesk', icon: LayoutDashboard },
  { name: 'Registry', href: '/frontdesk/registrations', icon: ClipboardList },
  { name: 'New', href: '/frontdesk/new-registration', icon: UserPlus },
  { name: 'Search', href: '/frontdesk/search', icon: Search },
];

export function FrontdeskSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attendedCount, setAttendedCount] = useState<number>(0);

  // Fetch attended counter from settings
  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'counters');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAttendedCount(data.yc26AttendedCounter || 0);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <>
      {/* Mobile menu button - Minimal */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-white/80 backdrop-blur-xl border-b border-gray-100 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">Y</span>
          </div>
          <div>
            <span className="font-semibold text-gray-900 text-sm">YC26</span>
            <span className="ml-2 text-xs text-gray-400 font-medium">{attendedCount} attended</span>
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 z-30 bg-black/20 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Narrow with icons + labels below */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-[72px] bg-[#fafafa] border-r border-gray-100 flex flex-col transform transition-transform duration-200 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo - Minimal */}
        <div className="h-16 flex items-center justify-center border-b border-gray-100">
          <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-base">Y</span>
          </div>
        </div>

        {/* Attended Counter - Premium badge */}
        <div className="px-2 py-3 border-b border-gray-100">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 bg-linear-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center shadow-sm">
              <Users className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 mt-1.5">{attendedCount}</span>
            <span className="text-[9px] text-gray-400 font-medium uppercase tracking-wider">Attended</span>
          </div>
        </div>

        {/* Navigation - Vertical icons with labels below */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== '/frontdesk' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-black text-white'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className={`w-5 h-5 mb-1 ${isActive ? 'text-white' : ''}`} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-white' : ''}`}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Sign out - Bottom */}
        <div className="p-2 pb-4 border-t border-gray-100">
          <button
            onClick={handleSignOut}
            className="w-full flex flex-col items-center justify-center py-2.5 px-1 rounded-xl text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">Exit</span>
          </button>
        </div>
      </div>
    </>
  );
}
