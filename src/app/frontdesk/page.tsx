// Frontdesk Dashboard - Main Page (Premium Minimal Style)
'use client';

import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import {
  Users,
  UserPlus,
  ClipboardCheck,
  Clock,
  ArrowRight,
  Loader2,
  Package,
} from 'lucide-react';

interface DashboardStats {
  totalRegistrations: number;
  attendedCount: number;
  pendingCount: number;
  normalCount: number;
  faithboxCount: number;
  kidsCount: number;
  brothersCount: number;
  sistersCount: number;
}

interface SettingsData {
  yc26AttendedCounter: number;
  yc26RegistrationCounter: number;
}

export default function FrontdeskDashboardPage() {
  const { role } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalRegistrations: 0,
    attendedCount: 0,
    pendingCount: 0,
    normalCount: 0,
    faithboxCount: 0,
    kidsCount: 0,
    brothersCount: 0,
    sistersCount: 0,
  });
  const [settings, setSettings] = useState<SettingsData>({
    yc26AttendedCounter: 0,
    yc26RegistrationCounter: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentRegistrations, setRecentRegistrations] = useState<{
    id: string;
    full_name: string;
    member_id: string;
    gender: string;
    registration_type: string;
    group_name: string | null;
  }[]>([]);

  // Fetch settings counters
  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'counters');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          yc26AttendedCounter: data.yc26AttendedCounter || 0,
          yc26RegistrationCounter: data.yc26RegistrationCounter || 0,
        });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const registrationsRef = collection(db, 'camps', 'YC26', 'registrations');
    const q = query(registrationsRef, orderBy('registration_date', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const regs: {
        id: string;
        full_name: string;
        member_id: string;
        gender: string;
        registration_type: string;
        group_name: string | null;
      }[] = [];
      let attended = 0;
      let pending = 0;
      let normal = 0;
      let faithbox = 0;
      let kids = 0;
      let brothers = 0;
      let sisters = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        regs.push({
          id: doc.id,
          full_name: data.full_name || '',
          member_id: data.member_id || '',
          gender: data.gender || 'M',
          registration_type: data.registration_type || 'normal',
          group_name: data.group_name || null,
        });

        // Count attended - Use group_name to determine status (same as admin)
        if (data.group_name) {
          attended++;
        } else {
          pending++;
        }

        // Count by type
        if (data.registration_type === 'normal') normal++;
        if (data.registration_type === 'faithbox') faithbox++;
        if (data.registration_type === 'kids') kids++;

        // Count by gender
        if (data.gender === 'M') brothers++;
        if (data.gender === 'F') sisters++;
      });

      setStats({
        totalRegistrations: regs.length,
        attendedCount: attended,
        pendingCount: pending,
        normalCount: normal,
        faithboxCount: faithbox,
        kidsCount: kids,
        brothersCount: brothers,
        sistersCount: sisters,
      });

      // Get recent 5 registrations
      setRecentRegistrations(regs.slice(0, 5));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="px-5 lg:px-8 mt-16 lg:mt-0 max-w-5xl mx-auto">
      {/* Header - Clean & Minimal */}
      <div className="mb-8">
        <p className="text-sm text-gray-400 mb-1">Welcome back</p>
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          {role?.name || 'Front Desk'}
        </h1>
      </div>

      {/* Main Stats - Premium Cards from Settings */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-gray-900 tracking-tight">{settings.yc26RegistrationCounter}</p>
          <p className="text-sm text-gray-500 mt-1">Total registered</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-semibold text-emerald-600 tracking-tight">{settings.yc26AttendedCounter}</p>
          <p className="text-sm text-gray-500 mt-1">Checked in</p>
        </div>
      </div>

      {/* Quick Actions - Minimal Style */}
      <div className="mb-8">
        <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/frontdesk/new-registration?type=normal"
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center group-hover:bg-gray-200 transition-colors">
              <UserPlus className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Normal</p>
              <p className="text-xs text-gray-400">₹300 min</p>
            </div>
          </Link>

          <Link
            href="/frontdesk/new-registration?type=faithbox"
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center group-hover:bg-violet-100 transition-colors">
              <Package className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Faithbox</p>
              <p className="text-xs text-gray-400">₹50 min</p>
            </div>
          </Link>

          <Link
            href="/frontdesk/new-registration?type=kids"
            className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all group"
          >
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center group-hover:bg-amber-100 transition-colors">
              <Users className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900 text-sm">Kids</p>
              <p className="text-xs text-gray-400">₹300 min</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <p className="text-xl font-semibold text-gray-900">{stats.normalCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">Normal</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <p className="text-xl font-semibold text-violet-600">{stats.faithboxCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">Faithbox</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <p className="text-xl font-semibold text-blue-600">{stats.brothersCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">Brothers</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-gray-100 text-center">
          <p className="text-xl font-semibold text-pink-600">{stats.sistersCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">Sisters</p>
        </div>
      </div>

      {/* Recent Registrations - Minimal List */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-50">
          <h3 className="text-sm font-medium text-gray-900">Recent</h3>
          <Link
            href="/frontdesk/registrations"
            className="text-xs text-gray-400 hover:text-gray-600 font-medium flex items-center gap-1 transition-colors"
          >
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recentRegistrations.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">
              No registrations yet
            </div>
          ) : (
            recentRegistrations.map((reg) => (
              <div key={reg.id} className="p-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-medium text-sm ${
                    reg.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'
                  }`}>
                    {reg.full_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{reg.full_name}</p>
                    <p className="text-xs text-gray-400">{reg.member_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex px-2 py-0.5 text-[10px] font-medium rounded-md ${
                    reg.registration_type === 'faithbox'
                      ? 'bg-violet-100 text-violet-700'
                      : reg.registration_type === 'kids'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {reg.registration_type}
                  </span>
                  {reg.group_name && (
                    <span className="text-[10px] text-emerald-600 font-medium">✓ {reg.group_name}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pending indicator */}
      {stats.pendingCount > 0 && (
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-amber-600">
          <Clock className="w-4 h-4" />
          <span>{stats.pendingCount} pending check-in</span>
        </div>
      )}
    </div>
  );
}
