// Frontdesk Registrations Page with Filters and ID Printing
// Uses the same logic as Admin for status display and ID printing
'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, query, onSnapshot, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  Search,
  Filter,
  Printer,
  Users,
  ClipboardCheck,
  Clock,
  X,
  Loader2,
  Check,
  Package,
  Eye,
  Church,
  User,
  Heart,
  GraduationCap,
  Target,
} from 'lucide-react';
import { PrintIdModal } from '@/components/admin/modals/PrintIdModal';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { FrontdeskRegistrationSheet, RegistrationType } from '@/components/frontdesk/FrontdeskRegistrationSheet';

interface Registration {
  registration_id: string;
  member_id: string;
  full_name: string;
  phone_number: string;
  church: string;
  gender: 'M' | 'F';
  registration_type: 'normal' | 'faithbox' | 'kids';
  payment_status: string;
  payment_amount?: number;
  group_name: string | null; // Use group_name to determine attended status (same as admin)
  yc26_registration_number?: number;
  yc26_attended_number?: number;
  registration_date: string;
  collected_faithbox: boolean | null;
  registered_by?: string;
}

interface MemberDetails {
  id: string;
  full_name: string;
  phone_number: string;
  gender: 'M' | 'F';
  dob?: string;
  age?: number;
  church_name: string;
  address: string;
  believer: boolean;
  fathername?: string;
  marriage_status?: string;
  baptism_date?: string;
  faith_box_supporter?: boolean;
  registered_camps?: string[];
  education?: string;
  occupation?: string;
  future_goals?: string;
  current_skills?: string;
  desired_skills?: string;
  created_at?: string;
}

type FilterType = 'all' | 'attended' | 'non-attended' | 'brothers' | 'sisters' | 'normal' | 'faithbox' | 'kids';

export default function FrontdeskRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Print ID Modal State
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Profile Sheet State
  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [profileData, setProfileData] = useState<{
    member: MemberDetails | null;
    registration: Registration | null;
  }>({ member: null, registration: null });
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Registration Sheet State - Using reusable component
  const [showRegSheet, setShowRegSheet] = useState(false);
  const [regSheetType, setRegSheetType] = useState<RegistrationType>('normal');

  // Open registration sheet with type
  const openRegSheet = (type: RegistrationType) => {
    setRegSheetType(type);
    setShowRegSheet(true);
  };

  // Fetch registrations in real-time
  useEffect(() => {
    const registrationsRef = collection(db, 'camps', 'YC26', 'registrations');
    const q = query(registrationsRef, orderBy('registration_date', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const regs: Registration[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        regs.push({
          registration_id: docSnap.id,
          member_id: data.member_id || '',
          full_name: data.full_name || '',
          phone_number: data.phone_number || '',
          church: data.church || data.church_name || '',
          gender: data.gender || 'M',
          registration_type: data.registration_type || 'normal',
          payment_status: data.payment_status || 'pending',
          group_name: data.group_name || null, // If group_name exists, they've attended
          yc26_registration_number: data.yc26_registration_number,
          yc26_attended_number: data.yc26_attended_number,
          registration_date: data.registration_date,
          collected_faithbox: data.collected_faithbox ?? null,
        });
      });
      setRegistrations(regs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Filter registrations
  const filteredRegistrations = useMemo(() => {
    let filtered = registrations;

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (reg) =>
          reg.full_name.toLowerCase().includes(q) ||
          reg.member_id.toLowerCase().includes(q) ||
          reg.registration_id.toLowerCase().includes(q) ||
          reg.phone_number.includes(q) ||
          reg.church.toLowerCase().includes(q)
      );
    }

    // Apply filter - Use group_name to determine attended status (same as admin)
    switch (activeFilter) {
      case 'attended':
        filtered = filtered.filter((reg) => reg.group_name !== null);
        break;
      case 'non-attended':
        filtered = filtered.filter((reg) => reg.group_name === null);
        break;
      case 'brothers':
        filtered = filtered.filter((reg) => reg.gender === 'M');
        break;
      case 'sisters':
        filtered = filtered.filter((reg) => reg.gender === 'F');
        break;
      case 'normal':
        filtered = filtered.filter((reg) => reg.registration_type === 'normal');
        break;
      case 'faithbox':
        filtered = filtered.filter((reg) => reg.registration_type === 'faithbox');
        break;
      case 'kids':
        filtered = filtered.filter((reg) => reg.registration_type === 'kids');
        break;
    }

    return filtered;
  }, [registrations, searchQuery, activeFilter]);

  // Get counts for filters - Use group_name for attended status (same as admin)
  const counts = useMemo(() => {
    return {
      all: registrations.length,
      attended: registrations.filter((r) => r.group_name !== null).length,
      'non-attended': registrations.filter((r) => r.group_name === null).length,
      brothers: registrations.filter((r) => r.gender === 'M').length,
      sisters: registrations.filter((r) => r.gender === 'F').length,
      normal: registrations.filter((r) => r.registration_type === 'normal').length,
      faithbox: registrations.filter((r) => r.registration_type === 'faithbox').length,
      kids: registrations.filter((r) => r.registration_type === 'kids').length,
    };
  }, [registrations]);

  // Handle Print ID Click - Opens the PrintIdModal
  const handlePrintClick = (reg: Registration) => {
    setSelectedRegistration(reg);
    setShowPrintModal(true);
  };

  // Handle Print Confirmation - Uses the same API as admin (/api/admin/print-id)
  // This API handles:
  // 1. First print: Increments yc26AttendedCounter, assigns group_name, sets yc26_attended_number
  // 2. Reprint: Only updates timestamp
  // 3. Faithbox collection status update
  const handlePrintConfirm = async (faithboxCollected?: boolean) => {
    if (!selectedRegistration) return;

    try {
      const response = await fetch('/api/admin/print-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_id: selectedRegistration.registration_id,
          collected_faithbox: faithboxCollected,
        }),
      });

      if (!response.ok) throw new Error('Failed to update registration');

      const result = await response.json();

      // Show success message with assigned group
      alert(`ID Card Printed!\nGroup Assigned: ${result.group_name}\nAttended #${result.attended_number}`);

      // Trigger actual print
      window.print();
    } catch (error) {
      console.error('Print error:', error);
      throw error;
    }
  };

  // Handle View Profile - Fetches member details and opens the sheet
  const handleViewProfile = async (reg: Registration) => {
    setLoadingProfile(true);
    setShowProfileSheet(true);
    setProfileData({ member: null, registration: reg });

    try {
      // Fetch member details from members collection
      const memberRef = doc(db, 'members', reg.member_id);
      const memberSnap = await getDoc(memberRef);

      if (memberSnap.exists()) {
        const data = memberSnap.data();
        setProfileData({
          member: {
            id: memberSnap.id,
            full_name: data.full_name || '',
            phone_number: data.phone_number || '',
            gender: data.gender || 'M',
            dob: data.dob?.toDate?.()?.toLocaleDateString() || data.dob || '',
            age: data.age,
            church_name: data.church_name || '',
            address: data.address || '',
            believer: data.believer ?? true,
            fathername: data.fathername || '',
            marriage_status: data.marriage_status || '',
            baptism_date: data.baptism_date?.toDate?.()?.toLocaleDateString() || data.baptism_date || '',
            faith_box_supporter: data.faith_box_supporter ?? false,
            registered_camps: data.registered_camps || [],
            education: data.education || '',
            occupation: data.occupation || '',
            future_goals: data.future_goals || '',
            current_skills: data.current_skills || '',
            desired_skills: data.desired_skills || '',
            created_at: data.created_at?.toDate?.()?.toLocaleDateString() || '',
          },
          registration: reg,
        });
      }
    } catch (error) {
      console.error('Error fetching member details:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const filterButtons: { key: FilterType; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: 'bg-gray-100 text-gray-700' },
    { key: 'attended', label: 'Attended', color: 'bg-green-100 text-green-700' },
    { key: 'non-attended', label: 'Pending', color: 'bg-orange-100 text-orange-700' },
    { key: 'brothers', label: 'Brothers', color: 'bg-blue-100 text-blue-700' },
    { key: 'sisters', label: 'Sisters', color: 'bg-pink-100 text-pink-700' },
    { key: 'normal', label: 'Normal', color: 'bg-indigo-100 text-indigo-700' },
    { key: 'faithbox', label: 'Faithbox', color: 'bg-emerald-100 text-emerald-700' },
    { key: 'kids', label: 'Kids', color: 'bg-purple-100 text-purple-700' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="px-5 lg:px-8 mt-16 lg:mt-0 pb-8 max-w-6xl mx-auto">
      {/* Header - Clean & Minimal */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Registrations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage registrations and print ID cards
        </p>
      </div>

      {/* Stats Row + Quick Actions - Compact */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Stats - Compact inline */}
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-100">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-semibold text-gray-900">{counts.all}</span>
          <span className="text-xs text-gray-400">Total</span>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-100">
          <ClipboardCheck className="w-4 h-4 text-emerald-500" />
          <span className="text-sm font-semibold text-emerald-600">{counts.attended}</span>
          <span className="text-xs text-gray-400">In</span>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-100">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-amber-600">{counts['non-attended']}</span>
          <span className="text-xs text-gray-400">Pending</span>
        </div>
        <div className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 border border-gray-100">
          <Package className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-semibold text-violet-600">{counts.faithbox}</span>
          <span className="text-xs text-gray-400">FB</span>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Quick Action Buttons */}
        <button
          onClick={() => openRegSheet('normal')}
          className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 text-white text-xs font-medium rounded-xl hover:bg-gray-800 transition-colors"
        >
          <Users className="w-3.5 h-3.5" />
          Normal
        </button>
        <button
          onClick={() => openRegSheet('faithbox')}
          className="flex items-center gap-1.5 px-3 py-2 bg-violet-600 text-white text-xs font-medium rounded-xl hover:bg-violet-700 transition-colors"
        >
          <Package className="w-3.5 h-3.5" />
          Faithbox
        </button>
      </div>

      {/* Search and Filter Bar - Minimal & Clean */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-5">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search - Clean minimal style */}
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-10 text-sm bg-gray-50 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all placeholder:text-gray-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Filter Toggle (Mobile) */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center justify-center gap-2 h-11 px-4 bg-gray-50 rounded-xl text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
            {activeFilter !== 'all' && (
              <span className="w-5 h-5 bg-gray-900 text-white rounded-full text-[10px] font-medium flex items-center justify-center">
                1
              </span>
            )}
          </button>
        </div>

        {/* Filter Chips - Minimal pill style */}
        <div className={`mt-3 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {filterButtons.map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                  activeFilter === filter.key
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filter.label} ({counts[filter.key]})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Registrations Table - Clean minimal design */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                  Reg
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                  Church
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRegistrations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No registrations found
                  </td>
                </tr>
              ) : (
                filteredRegistrations.map((reg) => (
                  <tr 
                    key={reg.registration_id} 
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Attended Number */}
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                      {reg.yc26_attended_number ? `${reg.yc26_attended_number}` : <span className="text-gray-300">—</span>}
                    </td>
                    {/* Member Info */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm shrink-0 ${
                            reg.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'
                          }`}
                        >
                          {reg.full_name?.charAt(0) || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{reg.full_name}</p>
                          <p className="text-xs text-gray-400 truncate">{reg.member_id}</p>
                        </div>
                      </div>
                    </td>
                    {/* Registration Number */}
                    <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">
                      {reg.yc26_registration_number ? `#${reg.yc26_registration_number}` : '—'}
                    </td>
                    {/* Church */}
                    <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell max-w-[140px] truncate">
                      {reg.church}
                    </td>
                    {/* Type & Faithbox Status */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded-md ${
                            reg.registration_type === 'faithbox'
                              ? 'bg-violet-100 text-violet-700'
                              : reg.registration_type === 'kids'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {reg.registration_type}
                        </span>
                        {reg.registration_type === 'faithbox' && (
                          <span className={`text-xs ${reg.collected_faithbox ? 'text-emerald-500' : 'text-gray-300'}`}>
                            {reg.collected_faithbox ? '✓' : '○'}
                          </span>
                        )}
                      </div>
                    </td>
                    {/* Group Status */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {reg.group_name ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md bg-emerald-100 text-emerald-700">
                          <Check className="w-3 h-3" />
                          Group {reg.group_name}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-md bg-gray-100 text-gray-500">
                          <Clock className="w-3 h-3" />
                          Pending
                        </span>
                      )}
                    </td>
                    {/* Actions - Minimal buttons */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        {/* View Profile Button */}
                        <button
                          onClick={() => handleViewProfile(reg)}
                          className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {/* Print ID Button */}
                        <button
                          onClick={() => handlePrintClick(reg)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            reg.group_name
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              : 'bg-gray-900 text-white hover:bg-gray-800'
                          }`}
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{reg.group_name ? 'Reprint' : 'Print'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print ID Modal - Reusing the Admin PrintIdModal component */}
      {/* This modal handles:
          1. Shows registration details
          2. For faithbox registrations, prompts to collect faithbox first
          3. Shows group preview / already assigned group
          4. Calls onPrint which triggers the /api/admin/print-id endpoint
      */}
      {selectedRegistration && (
        <PrintIdModal
          isOpen={showPrintModal}
          onClose={() => setShowPrintModal(false)}
          registration={selectedRegistration}
          onPrint={handlePrintConfirm}
        />
      )}

      {/* Profile Sheet - Premium Minimal Style */}
      <Sheet open={showProfileSheet} onOpenChange={setShowProfileSheet}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto p-0 bg-[#fafafa]">
          {/* Header - Clean & Minimal */}
          <SheetHeader className="p-5 pb-4 bg-white border-b border-gray-100">
            {profileData.registration && (
              <>
                <SheetTitle className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-semibold text-lg shrink-0 ${
                      profileData.registration.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'
                    }`}
                  >
                    {profileData.registration.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-gray-900 truncate">{profileData.registration.full_name}</p>
                    <p className="text-xs text-gray-400 font-normal mt-0.5">{profileData.registration.member_id}</p>
                  </div>
                </SheetTitle>
              </>
            )}
            <SheetDescription className="sr-only">
              View complete member and registration details
            </SheetDescription>
          </SheetHeader>

          {loadingProfile ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="p-5 space-y-4">
              {/* Registration Status Card - Premium minimal */}
              {profileData.registration && (
                <div className="bg-white rounded-2xl p-4 border border-gray-100">
                  <h3 className="text-[11px] uppercase tracking-wider font-medium text-gray-400 mb-3">
                    YC26 Registration
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase mb-1">Reg #</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {profileData.registration.yc26_registration_number || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase mb-1">Attended #</p>
                      <p className="text-sm font-semibold text-emerald-600">
                        {profileData.registration.yc26_attended_number || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase mb-1">Group</p>
                      <p className="text-sm font-semibold text-gray-900">
                        {profileData.registration.group_name || '—'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-100">
                    <span className={`inline-flex px-2 py-1 text-[11px] font-medium rounded-lg ${
                      profileData.registration.registration_type === 'faithbox'
                        ? 'bg-violet-100 text-violet-700'
                        : profileData.registration.registration_type === 'kids'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {profileData.registration.registration_type}
                    </span>
                    <span className={`inline-flex px-2 py-1 text-[11px] font-medium rounded-lg ${
                      profileData.registration.payment_status === 'completed'
                        ? 'bg-emerald-100 text-emerald-700'
                        : profileData.registration.payment_status === 'partial'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {profileData.registration.payment_status}
                    </span>
                    {profileData.registration.payment_amount && (
                      <span className="text-sm text-gray-500">₹{profileData.registration.payment_amount}</span>
                    )}
                  </div>
                  {profileData.registration.registration_type === 'faithbox' && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <p className={`text-xs font-medium ${profileData.registration.collected_faithbox ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {profileData.registration.collected_faithbox ? '✓ Faithbox Collected' : '○ Faithbox Pending'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Personal Information */}
              {profileData.member && (
                <>
                  <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <h3 className="text-[11px] uppercase tracking-wider font-medium text-gray-400 mb-3 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      Personal
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Phone</span>
                        <span className="text-sm font-medium text-gray-900">{profileData.member.phone_number}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Date of Birth</span>
                        <span className="text-sm font-medium text-gray-900">{profileData.member.dob || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Gender</span>
                        <span className="text-sm font-medium text-gray-900">
                          {profileData.member.gender === 'M' ? 'Male' : 'Female'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Marital Status</span>
                        <span className="text-sm font-medium text-gray-900 capitalize">
                          {profileData.member.marriage_status || '—'}
                        </span>
                      </div>
                      {profileData.member.fathername && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Father</span>
                          <span className="text-sm font-medium text-gray-900">{profileData.member.fathername}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Church & Address */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <h3 className="text-[11px] uppercase tracking-wider font-medium text-gray-400 mb-3 flex items-center gap-1.5">
                      <Church className="w-3.5 h-3.5" />
                      Church & Location
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-500">Church</span>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">{profileData.member.church_name}</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">Address</span>
                        <p className="text-sm font-medium text-gray-900 mt-0.5">{profileData.member.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Faith Details */}
                  <div className="bg-white rounded-2xl p-4 border border-gray-100">
                    <h3 className="text-[11px] uppercase tracking-wider font-medium text-gray-400 mb-3 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5" />
                      Faith
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Believer</span>
                        <span className="text-sm font-medium text-gray-900">
                          {profileData.member.believer ? 'Yes' : 'No'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Baptism</span>
                        <span className="text-sm font-medium text-gray-900">{profileData.member.baptism_date || '—'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Faithbox Supporter</span>
                        <span className="text-sm font-medium text-gray-900">
                          {profileData.member.faith_box_supporter ? 'Yes' : 'No'}
                        </span>
                      </div>
                      {profileData.member.registered_camps && profileData.member.registered_camps.length > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Camps</span>
                          <span className="text-sm font-medium text-gray-900">
                            {profileData.member.registered_camps.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Education & Career */}
                  {(profileData.member.education || profileData.member.occupation) && (
                    <div className="bg-white rounded-2xl p-4 border border-gray-100">
                      <h3 className="text-[11px] uppercase tracking-wider font-medium text-gray-400 mb-3 flex items-center gap-1.5">
                        <GraduationCap className="w-3.5 h-3.5" />
                        Education & Career
                      </h3>
                      <div className="space-y-3">
                        {profileData.member.education && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Education</span>
                            <span className="text-sm font-medium text-gray-900">{profileData.member.education}</span>
                          </div>
                        )}
                        {profileData.member.occupation && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Occupation</span>
                            <span className="text-sm font-medium text-gray-900">{profileData.member.occupation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Goals & Skills */}
                  {(profileData.member.future_goals || profileData.member.current_skills || profileData.member.desired_skills) && (
                    <div className="bg-white rounded-2xl p-4 border border-gray-100">
                      <h3 className="text-[11px] uppercase tracking-wider font-medium text-gray-400 mb-3 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" />
                        Goals & Skills
                      </h3>
                      <div className="space-y-3">
                        {profileData.member.future_goals && (
                          <div>
                            <span className="text-sm text-gray-500">Future Goals</span>
                            <p className="text-sm font-medium text-gray-900 mt-0.5">{profileData.member.future_goals}</p>
                          </div>
                        )}
                        {profileData.member.current_skills && (
                          <div>
                            <span className="text-sm text-gray-500">Current Skills</span>
                            <p className="text-sm font-medium text-gray-900 mt-0.5">{profileData.member.current_skills}</p>
                          </div>
                        )}
                        {profileData.member.desired_skills && (
                          <div>
                            <span className="text-sm text-gray-500">Desired Skills</span>
                            <p className="text-sm font-medium text-gray-900 mt-0.5">{profileData.member.desired_skills}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Member Since */}
                  {profileData.member.created_at && (
                    <p className="text-xs text-gray-400 text-center pt-2">
                      Member since {profileData.member.created_at}
                    </p>
                  )}
                </>
              )}

              {/* If member data not found */}
              {!loadingProfile && !profileData.member && profileData.registration && (
                <div className="text-center py-12 text-gray-400">
                  <User className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p className="text-sm">Member details not found</p>
                  <p className="text-xs text-gray-300 mt-1">{profileData.registration.member_id}</p>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Registration Sheet - Reusable Component */}
      <FrontdeskRegistrationSheet
        open={showRegSheet}
        onOpenChange={setShowRegSheet}
        initialType={regSheetType}
      />
    </div>
  );
}
