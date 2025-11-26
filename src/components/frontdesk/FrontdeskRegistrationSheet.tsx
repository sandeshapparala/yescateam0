// Frontdesk Registration Sheet Component
// Reusable registration form in a Sheet
// No phone verification, supports cash/online payment
// Can be used in multiple pages
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Users,
  Package,
  Loader2,
  Check,
  CreditCard,
  Banknote,
  User,
  Phone,
  Calendar,
  Church,
  MapPin,
  GraduationCap,
  Heart,
  Target,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

// Registration Type
export type RegistrationType = 'normal' | 'faithbox';
type PaymentMode = 'online' | 'cash';

// Zod Schema for form validation
const registrationSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone_number: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile number'),
  gender: z.enum(['M', 'F'], { message: 'Please select gender' }),
  age: z.number().min(1, 'Age required').max(100, 'Invalid age'),
  dob: z.string().optional(),
  believer: z.enum(['yes', 'no'], { message: 'Please select' }),
  church_name: z.string().min(2, 'Church name is required'),
  address: z.string().min(3, 'Address is required'),
  fathername: z.string().optional(),
  marriage_status: z.enum(['single', 'married', 'divorced', 'widowed']).optional(),
  baptism_date: z.string().optional(),
  camp_participated_since: z.string().optional(),
  education: z.string().optional(),
  occupation: z.string().optional(),
  future_goals: z.string().optional(),
  current_skills: z.string().optional(),
  desired_skills: z.string().optional(),
});

type RegistrationFormData = z.infer<typeof registrationSchema>;

// Price options by type
const PRICE_OPTIONS: Record<RegistrationType, number[]> = {
  normal: [300, 400, 500, 600, 700, 800, 900, 1000],
  faithbox: [50, 100, 150, 200, 250, 300],
};

const MIN_PRICES: Record<RegistrationType, number> = {
  normal: 300,
  faithbox: 50,
};

interface RegistrationResult {
  member_id: string;
  registration_id: string;
  yc26_registration_number: number;
}

interface FrontdeskRegistrationSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialType?: RegistrationType;
  onSuccess?: (result: RegistrationResult) => void;
}

export function FrontdeskRegistrationSheet({
  open,
  onOpenChange,
  initialType = 'normal',
  onSuccess,
}: FrontdeskRegistrationSheetProps) {
  const { user } = useAuth();
  
  const [registrationType, setRegistrationType] = useState<RegistrationType>(initialType);
  const [selectedAmount, setSelectedAmount] = useState(MIN_PRICES[initialType]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [collectedFaithbox, setCollectedFaithbox] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registrationResult, setRegistrationResult] = useState<RegistrationResult | null>(null);
  
  // Cash confirmation dialog state
  const [showCashConfirmation, setShowCashConfirmation] = useState(false);
  const [pendingFormData, setPendingFormData] = useState<RegistrationFormData | null>(null);
  
  // Online payment states
  const [initiatingPayment, setInitiatingPayment] = useState(false);

  // Form
  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      phone_number: '',
      full_name: '',
      age: undefined,
      gender: undefined,
      believer: undefined,
      church_name: '',
      address: '',
      marriage_status: 'single',
    },
  });

  // Reset form when sheet opens with initial type
  useEffect(() => {
    if (open) {
      setRegistrationType(initialType);
      setSelectedAmount(MIN_PRICES[initialType]);
      setPaymentMode('cash');
      setCollectedFaithbox(false);
      setSuccess(false);
      setError(null);
      setRegistrationResult(null);
      form.reset();
    }
  }, [open, initialType, form]);

  // Update amount when type changes
  useEffect(() => {
    setSelectedAmount(MIN_PRICES[registrationType]);
  }, [registrationType]);

  // Handle form submission - validates and routes to cash/online flow
  const handleSubmit = async (data: RegistrationFormData) => {
    setError(null);
    
    if (paymentMode === 'cash') {
      // Show cash confirmation dialog
      setPendingFormData(data);
      setShowCashConfirmation(true);
    } else {
      // Online payment - initiate PhonePe
      await initiateOnlinePayment(data);
    }
  };

  // Handle cash payment confirmation
  const handleCashConfirm = async () => {
    if (!pendingFormData) return;
    
    setIsSubmitting(true);
    setShowCashConfirmation(false);
    setError(null);

    try {
      const response = await fetch('/api/frontdesk/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: pendingFormData,
          registration_type: registrationType,
          amount: selectedAmount,
          payment_mode: 'cash',
          collected_faithbox: registrationType === 'faithbox' ? collectedFaithbox : null,
          registered_by: user?.email || 'frontdesk',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      setRegistrationResult(result);
      setSuccess(true);
      setPendingFormData(null);
      onSuccess?.(result);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle online payment - initiate PhonePe
  const initiateOnlinePayment = async (data: RegistrationFormData) => {
    setInitiatingPayment(true);
    setError(null);

    try {
      // Call the payment initiation API (same as online registration)
      const response = await fetch('/api/frontdesk/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: data,
          registration_type: registrationType,
          amount: selectedAmount,
          collected_faithbox: registrationType === 'faithbox' ? collectedFaithbox : null,
          registered_by: user?.email || 'frontdesk',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to initiate payment');
      }

      // Redirect to PhonePe payment page
      if (result.redirect_url) {
        window.location.href = result.redirect_url;
      } else {
        throw new Error('No payment URL received');
      }
    } catch (err) {
      console.error('Payment initiation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to initiate payment');
      setInitiatingPayment(false);
    }
  };

  // Reset and register another
  const handleRegisterAnother = () => {
    setSuccess(false);
    setRegistrationResult(null);
    form.reset();
    setCollectedFaithbox(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-2xl overflow-y-auto p-0 bg-[#fafafa]"
      >
        {/* Header */}
        <SheetHeader className="p-5 pb-4 bg-white border-b border-gray-100 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-lg font-semibold text-gray-900">
                New Registration
              </SheetTitle>
              <SheetDescription className="text-xs text-gray-500 mt-0.5">
                Register a new member for YC26
              </SheetDescription>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          {/* Type Switcher - Always visible */}
          {!success && (
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setRegistrationType('normal')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  registrationType === 'normal'
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Normal
              </button>
              <button
                onClick={() => setRegistrationType('faithbox')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  registrationType === 'faithbox'
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                Faithbox
              </button>
            </div>
          )}
        </SheetHeader>

        {/* Success State */}
        {success && registrationResult ? (
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Registration Successful!</h2>
              <p className="text-sm text-gray-500 mt-1">Member has been registered for YC26</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase mb-1">Member ID</p>
                  <p className="text-lg font-bold text-gray-900 font-mono">{registrationResult.member_id}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase mb-1">Reg #</p>
                  <p className="text-lg font-bold text-emerald-600">#{registrationResult.yc26_registration_number}</p>
                </div>
              </div>
              <div className="pt-3 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 uppercase mb-1">Registration ID</p>
                <p className="text-sm font-mono text-gray-600">{registrationResult.registration_id}</p>
              </div>
              <div className="pt-3 border-t border-gray-100 flex items-center gap-2">
                <span className={`inline-flex px-2 py-1 text-[11px] font-medium rounded-lg ${
                  registrationType === 'faithbox'
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {registrationType}
                </span>
                <span className={`inline-flex px-2 py-1 text-[11px] font-medium rounded-lg ${
                  paymentMode === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {paymentMode === 'cash' ? 'Cash' : 'Online'} - ₹{selectedAmount}
                </span>
                {registrationType === 'faithbox' && (
                  <span className={`inline-flex px-2 py-1 text-[11px] font-medium rounded-lg ${
                    collectedFaithbox ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {collectedFaithbox ? '✓ FB Collected' : '○ FB Pending'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={handleRegisterAnother}
                className="flex-1 bg-gray-900 hover:bg-gray-800"
              >
                Register Another
              </Button>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* Registration Form */
          <form onSubmit={form.handleSubmit(handleSubmit)} className="p-5 space-y-4">
            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                {error}
              </div>
            )}

            {/* Personal Information */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h3 className="text-[11px] uppercase tracking-wider font-medium text-gray-400 mb-4 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Full Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...form.register('full_name')}
                    placeholder="Enter full name"
                    className="w-full h-10 px-3 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all"
                  />
                  {form.formState.errors.full_name && (
                    <p className="text-[10px] text-red-500 mt-0.5">{form.formState.errors.full_name.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      {...form.register('phone_number')}
                      placeholder="10-digit number"
                      className="w-full h-10 pl-9 pr-3 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all"
                    />
                  </div>
                  {form.formState.errors.phone_number && (
                    <p className="text-[10px] text-red-500 mt-0.5">{form.formState.errors.phone_number.message}</p>
                  )}
                </div>

                {/* Gender */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <label className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                      form.watch('gender') === 'M' ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}>
                      <input type="radio" {...form.register('gender')} value="M" className="sr-only" />
                      Male
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                      form.watch('gender') === 'F' ? 'bg-pink-100 text-pink-700 ring-2 ring-pink-500' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}>
                      <input type="radio" {...form.register('gender')} value="F" className="sr-only" />
                      Female
                    </label>
                  </div>
                  {form.formState.errors.gender && (
                    <p className="text-[10px] text-red-500 mt-0.5">{form.formState.errors.gender.message}</p>
                  )}
                </div>

                {/* Age */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    {...form.register('age', { valueAsNumber: true })}
                    placeholder="Age"
                    className="w-full h-10 px-3 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all"
                  />
                  {form.formState.errors.age && (
                    <p className="text-[10px] text-red-500 mt-0.5">{form.formState.errors.age.message}</p>
                  )}
                </div>

                {/* DOB */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Date of Birth
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      {...form.register('dob')}
                      className="w-full h-10 pl-9 pr-3 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                {/* Father Name */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Father&apos;s Name
                  </label>
                  <input
                    {...form.register('fathername')}
                    placeholder="Enter father's name"
                    className="w-full h-10 px-3 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all"
                  />
                </div>

                {/* Marriage Status */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Marital Status
                  </label>
                  <select
                    {...form.register('marriage_status')}
                    className="w-full h-10 px-3 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all"
                  >
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>

                {/* Believer */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Believer? <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <label className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                      form.watch('believer') === 'yes' ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}>
                      <input type="radio" {...form.register('believer')} value="yes" className="sr-only" />
                      Yes
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                      form.watch('believer') === 'no' ? 'bg-gray-200 text-gray-700 ring-2 ring-gray-400' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}>
                      <input type="radio" {...form.register('believer')} value="no" className="sr-only" />
                      No
                    </label>
                  </div>
                  {form.formState.errors.believer && (
                    <p className="text-[10px] text-red-500 mt-0.5">{form.formState.errors.believer.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Church & Address */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h3 className="text-[11px] uppercase tracking-wider font-medium text-gray-400 mb-4 flex items-center gap-1.5">
                <Church className="w-3.5 h-3.5" />
                Church & Location
              </h3>
              
              <div className="space-y-3">
                {/* Church */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Church Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Church className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      {...form.register('church_name')}
                      placeholder="Enter church name"
                      className="w-full h-10 pl-9 pr-3 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all"
                    />
                  </div>
                  {form.formState.errors.church_name && (
                    <p className="text-[10px] text-red-500 mt-0.5">{form.formState.errors.church_name.message}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <textarea
                      {...form.register('address')}
                      placeholder="Enter full address"
                      rows={2}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all resize-none"
                    />
                  </div>
                  {form.formState.errors.address && (
                    <p className="text-[10px] text-red-500 mt-0.5">{form.formState.errors.address.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Faith Details */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h3 className="text-[11px] uppercase tracking-wider font-medium text-gray-400 mb-4 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5" />
                Faith Details
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {/* Baptism Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Baptism Date
                  </label>
                  <input
                    type="date"
                    {...form.register('baptism_date')}
                    className="w-full h-10 px-3 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all"
                  />
                </div>

                {/* Camp Participated Since */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Camp Since
                  </label>
                  <input
                    {...form.register('camp_participated_since')}
                    placeholder="e.g., YC24"
                    className="w-full h-10 px-3 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Education & Career (Optional) */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h3 className="text-[11px] uppercase tracking-wider font-medium text-gray-400 mb-4 flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                Education & Career (Optional)
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Education</label>
                  <input
                    {...form.register('education')}
                    placeholder="Education level"
                    className="w-full h-10 px-3 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Occupation</label>
                  <input
                    {...form.register('occupation')}
                    placeholder="Your occupation"
                    className="w-full h-10 px-3 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Goals & Skills (Optional) */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h3 className="text-[11px] uppercase tracking-wider font-medium text-gray-400 mb-4 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Goals & Skills (Optional)
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Future Goals</label>
                  <input
                    {...form.register('future_goals')}
                    placeholder="Your future goals"
                    className="w-full h-10 px-3 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Current Skills</label>
                    <input
                      {...form.register('current_skills')}
                      placeholder="Skills you have"
                      className="w-full h-10 px-3 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Desired Skills</label>
                    <input
                      {...form.register('desired_skills')}
                      placeholder="Skills to learn"
                      className="w-full h-10 px-3 text-sm bg-gray-50 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Section */}
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <h3 className="text-[11px] uppercase tracking-wider font-medium text-gray-400 mb-4 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                Payment
              </h3>

              {/* Amount Selection */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Amount (Min ₹{MIN_PRICES[registrationType]})
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRICE_OPTIONS[registrationType].map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setSelectedAmount(amount)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        selectedAmount === amount
                          ? 'bg-gray-900 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Payment Mode
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('cash')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      paymentMode === 'cash'
                        ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('online')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      paymentMode === 'online'
                        ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    Online
                  </button>
                </div>
              </div>
            </div>

            {/* Faithbox Collection (only for faithbox type) */}
            {registrationType === 'faithbox' && (
              <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100">
                <h3 className="text-[11px] uppercase tracking-wider font-medium text-violet-600 mb-3 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5" />
                  Faithbox Collection
                </h3>
                
                <button
                  type="button"
                  onClick={() => setCollectedFaithbox(!collectedFaithbox)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                    collectedFaithbox
                      ? 'bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {collectedFaithbox ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Package className="w-4 h-4" />
                    )}
                    {collectedFaithbox ? 'Faithbox Collected' : 'Mark as Collected'}
                  </span>
                  {collectedFaithbox && <CheckCircle2 className="w-5 h-5" />}
                </button>
                <p className="text-[10px] text-violet-600 mt-2">
                  Collect the faithbox from the member before completing registration
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="sticky bottom-0 bg-[#fafafa] pt-4 pb-2 -mx-5 px-5 border-t border-gray-100">
              <Button
                type="submit"
                disabled={isSubmitting || initiatingPayment}
                className={`w-full h-12 rounded-xl text-sm font-medium ${
                  paymentMode === 'online' 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-900 hover:bg-gray-800'
                } text-white`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registering...
                  </>
                ) : initiatingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Initiating Payment...
                  </>
                ) : paymentMode === 'online' ? (
                  <>
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Pay ₹{selectedAmount} via PhonePe
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Complete Registration - ₹{selectedAmount}
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Cash Payment Confirmation Dialog */}
        <Dialog open={showCashConfirmation} onOpenChange={setShowCashConfirmation}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold">Confirm Cash Payment</DialogTitle>
                  <DialogDescription className="text-sm text-gray-500">
                    Please confirm you have collected the payment
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              {/* Amount Display */}
              <div className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Amount to Collect</p>
                <p className="text-3xl font-bold text-gray-900">₹{selectedAmount}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {registrationType === 'faithbox' ? 'Faithbox Registration' : 'Normal Registration'}
                </p>
              </div>
              
              {/* Member Info Summary */}
              {pendingFormData && (
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium ${
                      pendingFormData.gender === 'M' ? 'bg-blue-500' : 'bg-pink-500'
                    }`}>
                      {pendingFormData.full_name?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{pendingFormData.full_name}</p>
                      <p className="text-xs text-gray-500">{pendingFormData.phone_number}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning */}
              <div className="flex items-start gap-2 bg-amber-50 text-amber-800 rounded-lg p-3 text-sm">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>Make sure you have collected <strong>₹{selectedAmount}</strong> in cash before confirming.</p>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCashConfirmation(false);
                  setPendingFormData(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCashConfirm}
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Yes, Payment Collected
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </SheetContent>
    </Sheet>
  );
}
