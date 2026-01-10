// Registration API Route
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { generateMemberId } from '@/lib/firebase/utils';
import { generateRegId } from '@/lib/registration/types';
import { registrationSchema } from '@/lib/validations/registration';
import { RegistrationType } from '@/lib/registration/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request data
    const validationResult = registrationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const registrationType: RegistrationType = body.registration_type || 'normal';

    // Get next member counter and YC26 registration counter
    const counterRef = adminDb.collection('settings').doc('counters');
    const counterDoc = await counterRef.get();
    const counters = counterDoc.data() || {};
    const currentMemberCounter = counters.memberCounter || 0;
    const currentYC26Counter = counters.yc26RegistrationCounter || 0;
    const newMemberCounter = currentMemberCounter + 1;
    const newYC26Counter = currentYC26Counter + 1;

    // Generate IDs
    const memberId = generateMemberId(newMemberCounter);
    const regId = generateRegId('YC26');

    const timestamp = new Date().toISOString();

    // Create member document
    const memberData = {
      member_id: memberId,
      full_name: data.full_name,
      phone_number: data.phone_number,
      gender: data.gender,
      age: data.age,
      dob: data.dob || null,
      believer: data.believer === 'yes',
      church_name: data.church_name,
      address: data.address,
      fathername: data.fathername || null,
      marriage_status: data.marriage_status || null,
      baptism_date: data.baptism_date || null,
      camp_participated_since: data.camp_participated_since || null,
      education: data.education || null,
      occupation: data.occupation || null,
      future_goals: data.future_goals || null,
      current_skills: data.current_skills || null,
      desired_skills: data.desired_skills || null,
      created_at: timestamp,
      updated_at: timestamp,
    };

    // Create camp registration document
    const campRegData = {
      registration_id: regId,
      member_id: memberId,
      camp_id: 'YC26',
      full_name: data.full_name,
      phone_number: data.phone_number,
      gender: data.gender,
      age: data.age,
      church_name: data.church_name,
      registration_type: registrationType,
      registration_date: timestamp,
      payment_status: 'pending',
      attendance_status: 'registered',
      group_name: null, // Assigned by front desk when printing ID card
      yc26_registration_number: newYC26Counter, // Online registration sequence
      yc26_attended_number: null, // Assigned when ID card is printed at camp
      collected_faithbox: registrationType === 'faithbox' ? false : null,
      registered_by: 'online',
      created_at: timestamp,
      updated_at: timestamp,
    };

    // Batch write to Firestore
    const batch = adminDb.batch();

    // Add member document
    const memberRef = adminDb.collection('members').doc(memberId);
    batch.set(memberRef, memberData);

    // Add camp registration document
    const campRegRef = adminDb.collection('camps').doc('YC26').collection('registrations').doc(regId);
    batch.set(campRegRef, campRegData);

    // Update counters (both member and YC26 registration)
    batch.update(counterRef, {
      memberCounter: newMemberCounter,
      yc26RegistrationCounter: newYC26Counter,
      lastUpdated: timestamp,
    });

    // Commit batch
    await batch.commit();

    // Create audit log
    await adminDb.collection('audit_logs').add({
      action: 'registration_created',
      resource_type: 'registration',
      resource_id: regId,
      actor_type: 'system',
      actor_id: 'online_registration',
      details: {
        member_id: memberId,
        registration_type: registrationType,
        full_name: data.full_name,
      },
      timestamp,
    });

    return NextResponse.json({
      success: true,
      member_id: memberId,
      registration_id: regId,
      yc26_registration_number: newYC26Counter,
      message: 'Registration successful',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to process registration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
