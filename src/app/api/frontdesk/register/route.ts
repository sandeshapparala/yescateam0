// Frontdesk Registration API Route
// Handles registration without OTP verification
// Supports cash and online payments
// Tracks who registered the member

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { generateMemberId } from '@/lib/firebase/utils';

// Generate registration ID
function generateRegId(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';
  
  // Generate 2 random letters
  let letters = '';
  for (let i = 0; i < 2; i++) {
    letters += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Generate 2 random numbers
  let numbers = '';
  for (let i = 0; i < 2; i++) {
    numbers += nums.charAt(Math.floor(Math.random() * nums.length));
  }
  
  return `${prefix}${letters}${numbers}`;
}

// Registration type
type RegistrationType = 'normal' | 'faithbox' | 'kids';
type PaymentMode = 'cash' | 'online';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      formData,
      registration_type,
      amount,
      payment_mode,
      collected_faithbox,
      registered_by,
    } = body as {
      formData: {
        full_name: string;
        phone_number: string;
        gender: 'M' | 'F';
        age: number;
        dob?: string;
        believer: 'yes' | 'no';
        church_name: string;
        address: string;
        fathername?: string;
        marriage_status?: string;
        baptism_date?: string;
        camp_participated_since?: string;
        education?: string;
        occupation?: string;
        future_goals?: string;
        current_skills?: string;
        desired_skills?: string;
      };
      registration_type: RegistrationType;
      amount: number;
      payment_mode: PaymentMode;
      collected_faithbox: boolean | null;
      registered_by: string;
    };

    // Validate required fields
    if (!formData.full_name || !formData.phone_number || !formData.gender || !formData.age || !formData.church_name || !formData.address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate minimum amounts
    const minAmounts: Record<RegistrationType, number> = {
      normal: 300,
      faithbox: 50,
      kids: 300,
    };

    if (amount < minAmounts[registration_type]) {
      return NextResponse.json(
        { error: `Minimum amount for ${registration_type} is ₹${minAmounts[registration_type]}` },
        { status: 400 }
      );
    }

    // Get counters
    const countersRef = adminDb.collection('settings').doc('counters');
    const countersSnap = await countersRef.get();
    
    if (!countersSnap.exists) {
      return NextResponse.json({ error: 'Counters not initialized' }, { status: 500 });
    }

    const counters = countersSnap.data()!;
    const currentMemberCounter = counters.memberCounter || 0;
    const currentYc26Counter = counters.yc26RegistrationCounter || 0;

    // Generate IDs
    const newMemberCounter = currentMemberCounter + 1;
    const newYc26Counter = currentYc26Counter + 1;
    const memberId = generateMemberId(newMemberCounter);
    const registrationId = generateRegId('YC26');

    // Create batch for atomic writes
    const batch = adminDb.batch();

    // Create member document
    const memberRef = adminDb.collection('members').doc(memberId);
    const memberData = {
      member_id: memberId,
      full_name: formData.full_name,
      phone_number: formData.phone_number,
      gender: formData.gender,
      age: formData.age,
      dob: formData.dob || null,
      believer: formData.believer === 'yes',
      church_name: formData.church_name,
      address: formData.address,
      fathername: formData.fathername || null,
      marriage_status: formData.marriage_status || null,
      baptism_date: formData.baptism_date || null,
      camp_participated_since: formData.camp_participated_since || null,
      education: formData.education || null,
      occupation: formData.occupation || null,
      future_goals: formData.future_goals || null,
      current_skills: formData.current_skills || null,
      desired_skills: formData.desired_skills || null,
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };
    batch.set(memberRef, memberData);

    // Create registration document
    const registrationRef = adminDb.collection('camps').doc('YC26').collection('registrations').doc(registrationId);
    const registrationData = {
      registration_id: registrationId,
      member_id: memberId,
      full_name: formData.full_name,
      phone_number: formData.phone_number,
      gender: formData.gender,
      age: formData.age,
      church_name: formData.church_name,
      registration_type: registration_type,
      amount_paid: amount,
      payment_mode: payment_mode,
      payment_status: 'completed', // Frontdesk registrations are immediately completed
      yc26_registration_number: newYc26Counter,
      yc26_attended_number: null, // Assigned when ID is printed
      group_name: null, // Assigned when ID is printed
      registered_by: registered_by || 'frontdesk',
      collected_faithbox: registration_type === 'faithbox' ? (collected_faithbox || false) : null,
      id_printed: false,
      registration_date: new Date().toISOString(),
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    };
    batch.set(registrationRef, registrationData);

    // Update counters
    batch.update(countersRef, {
      memberCounter: FieldValue.increment(1),
      yc26RegistrationCounter: FieldValue.increment(1),
    });

    // Commit the batch
    await batch.commit();

    return NextResponse.json({
      success: true,
      member_id: memberId,
      registration_id: registrationId,
      yc26_registration_number: newYc26Counter,
    });

  } catch (error) {
    console.error('Frontdesk registration error:', error);
    return NextResponse.json(
      { error: 'Failed to complete registration' },
      { status: 500 }
    );
  }
}
