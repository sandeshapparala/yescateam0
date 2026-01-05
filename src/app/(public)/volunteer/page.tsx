// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Users, Phone, User, Church, MapPin, Calendar, ShieldCheck } from 'lucide-react';
import { OTPVerificationModal } from '@/components/auth/OTPVerificationModal';
import { PriceSelector } from '@/components/registration/PriceSelector';

// Volunteer form schema
const volunteerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone_number: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  age: z.coerce.number().min(16, 'Must be at least 16 years old').max(60, 'Must be under 60 years old'),
  church_name: z.string().min(2, 'Church name is required'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
});

type VolunteerFormData = z.infer<typeof volunteerSchema>;

export default function VolunteerRegistrationPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [formData, setFormData] = useState<VolunteerFormData | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(300);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<VolunteerFormData>({
    resolver: zodResolver(volunteerSchema) as any,
    defaultValues: {
      full_name: '',
      phone_number: '',
      age: undefined as unknown as number,
      church_name: '',
      address: '',
    },
  });

  const onSubmit = async (data: VolunteerFormData) => {
    setFormData(data);
    
    // If already verified, proceed to payment directly
    if (isVerified) {
      await initiatePayment(data);
      return;
    }
    
    // Show OTP modal for verification
    setShowOTPModal(true);
  };

  const handleVerificationSuccess = async () => {
    setIsVerified(true);
    setShowOTPModal(false);
    
    // After verification, proceed to payment
    if (formData) {
      await initiatePayment(formData);
    }
  };

  const initiatePayment = async (data: VolunteerFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/volunteer/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formData: data,
          amount: selectedAmount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Payment initiation failed');
      }

      // Store merchant order ID in sessionStorage for later reference
      sessionStorage.setItem('volunteer_merchant_order_id', result.merchant_order_id);

      // Redirect to PhonePe payment page
      if (result.redirect_url) {
        window.location.href = result.redirect_url;
      } else {
        throw new Error('No payment redirect URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert(error instanceof Error ? error.message : 'Payment initiation failed');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 mb-4">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Volunteer Registration
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            YC26 Youth Camp - Join us as a volunteer
          </p>
        </div>

        {/* Registration Form */}
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl">Registration Details</CardTitle>
              <CardDescription>
                Fill in your details to register as a volunteer
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="full_name"
                    placeholder="Enter your full name"
                    {...register('full_name')}
                    className={errors.full_name ? 'border-red-500' : ''}
                  />
                  {errors.full_name && (
                    <p className="text-sm text-red-500">{errors.full_name.message}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone_number" className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone Number <span className="text-red-500">*</span>
                  </Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-400">
                      +91
                    </span>
                    <Input
                      id="phone_number"
                      placeholder="9876543210"
                      maxLength={10}
                      {...register('phone_number')}
                      className={`rounded-l-none ${errors.phone_number ? 'border-red-500' : ''}`}
                    />
                  </div>
                  {errors.phone_number && (
                    <p className="text-sm text-red-500">{errors.phone_number.message}</p>
                  )}
                </div>

                {/* Age */}
                <div className="space-y-2">
                  <Label htmlFor="age" className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Age <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Enter your age"
                    min={16}
                    max={60}
                    {...register('age')}
                    className={errors.age ? 'border-red-500' : ''}
                  />
                  {errors.age && (
                    <p className="text-sm text-red-500">{errors.age.message}</p>
                  )}
                  <p className="text-xs text-gray-500">Must be between 16 and 60 years old</p>
                </div>

                {/* Church Name */}
                <div className="space-y-2">
                  <Label htmlFor="church_name" className="flex items-center gap-2">
                    <Church className="w-4 h-4" />
                    Church Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="church_name"
                    placeholder="Enter your church name"
                    {...register('church_name')}
                    className={errors.church_name ? 'border-red-500' : ''}
                  />
                  {errors.church_name && (
                    <p className="text-sm text-red-500">{errors.church_name.message}</p>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Address <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="Enter your full address"
                    rows={3}
                    {...register('address')}
                    className={errors.address ? 'border-red-500' : ''}
                  />
                  {errors.address && (
                    <p className="text-sm text-red-500">{errors.address.message}</p>
                  )}
                </div>

                {/* Price Selector */}
                <PriceSelector
                  registrationType="normal"
                  value={selectedAmount}
                  onChange={setSelectedAmount}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Processing Payment...
                    </>
                  ) : isVerified ? (
                    <>
                      Proceed to Pay ₹{selectedAmount.toLocaleString('en-IN')}
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5 mr-2" />
                      Verify Phone & Continue
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                  By registering, you agree to participate as a volunteer at YC26 Youth Camp
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {formData && (
        <OTPVerificationModal
          isOpen={showOTPModal}
          onClose={() => setShowOTPModal(false)}
          phoneNumber={`+91${formData.phone_number}`}
          onVerificationSuccess={handleVerificationSuccess}
        />
      )}
    </div>
  );
}
