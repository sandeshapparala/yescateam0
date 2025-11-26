// Frontdesk Payment Callback API Route
// Handles PhonePe payment response for frontdesk registrations
// Creates member and registration after successful payment
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { generateMemberId } from '@/lib/firebase/utils';
import { checkPhonePeOrderStatus } from '@/lib/payment/phonepe';

// Generate registration ID
function generateRegId(prefix: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const nums = '0123456789';
  
  let letters = '';
  for (let i = 0; i < 2; i++) {
    letters += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  let numbers = '';
  for (let i = 0; i < 2; i++) {
    numbers += nums.charAt(Math.floor(Math.random() * nums.length));
  }
  
  return `${prefix}${letters}${numbers}`;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Frontdesk payment callback received');
    
    // PhonePe sends data as form-urlencoded
    const phonePeFormData = await request.formData();
    const response = phonePeFormData.get('response') as string;
    
    console.log('PhonePe callback response:', response);
    
    if (!response) {
      console.error('No response data from PhonePe');
      return NextResponse.redirect(
        new URL('/frontdesk/payment-callback?error=no_response', request.url)
      );
    }

    // Decode the base64 response
    const decodedResponse = JSON.parse(Buffer.from(response, 'base64').toString('utf-8'));
    console.log('Decoded PhonePe response:', decodedResponse);
    
    const transactionId = decodedResponse.data?.merchantTransactionId;
    const paymentStatus = decodedResponse.code;
    
    if (!transactionId) {
      console.error('Transaction ID missing from response');
      return NextResponse.redirect(
        new URL('/frontdesk/payment-callback?error=no_transaction_id', request.url)
      );
    }

    console.log(`Frontdesk payment status for ${transactionId}: ${paymentStatus}`);

    // Verify this is a frontdesk payment (starts with FD_)
    if (!transactionId.startsWith('FD_')) {
      console.error('Not a frontdesk transaction:', transactionId);
      return NextResponse.redirect(
        new URL('/frontdesk/payment-callback?error=invalid_transaction', request.url)
      );
    }

    // Get pending registration data
    const pendingRegRef = adminDb.collection('camps').doc('YC26').collection('pending_registrations').doc(transactionId);
    const pendingRegDoc = await pendingRegRef.get();

    if (!pendingRegDoc.exists) {
      console.error('Pending registration not found for:', transactionId);
      return NextResponse.redirect(
        new URL(`/frontdesk/payment-callback?error=pending_not_found&transaction=${transactionId}`, request.url)
      );
    }

    const pendingData = pendingRegDoc.data()!;

    // Check payment status
    if (paymentStatus !== 'PAYMENT_SUCCESS') {
      console.log('Frontdesk payment not successful, status:', paymentStatus);
      
      // Update pending registration with failed status
      await pendingRegRef.update({
        payment_status: 'failed',
        status: 'failed',
        failure_reason: paymentStatus,
        updated_at: new Date().toISOString(),
      });
      
      return NextResponse.redirect(
        new URL(`/frontdesk/payment-callback?status=failed&transaction=${transactionId}&reason=${paymentStatus}`, request.url)
      );
    }

    // Payment successful - create member and registration
    console.log('Frontdesk payment successful, creating member and registration...');

    const registrationType = pendingData.registration_type;
    const amount = pendingData.amount;

    // Get counters and generate IDs
    const counterRef = adminDb.collection('settings').doc('counters');
    const counterDoc = await counterRef.get();
    const counters = counterDoc.data() || {};
    const currentMemberCounter = counters.memberCounter || 0;
    const currentYC26Counter = counters.yc26RegistrationCounter || 0;
    const newMemberCounter = currentMemberCounter + 1;
    const newYC26Counter = currentYC26Counter + 1;

    const memberId = generateMemberId(newMemberCounter);
    const regId = generateRegId('YC26');
    const timestamp = new Date().toISOString();

    // Create member document
    const memberData = {
      member_id: memberId,
      full_name: pendingData.full_name,
      phone_number: pendingData.phone_number,
      gender: pendingData.gender,
      age: pendingData.age,
      dob: pendingData.dob || null,
      believer: pendingData.believer,
      church_name: pendingData.church_name,
      address: pendingData.address,
      fathername: pendingData.fathername || null,
      marriage_status: pendingData.marriage_status || null,
      baptism_date: pendingData.baptism_date || null,
      camp_participated_since: pendingData.camp_participated_since || null,
      education: pendingData.education || null,
      occupation: pendingData.occupation || null,
      future_goals: pendingData.future_goals || null,
      current_skills: pendingData.current_skills || null,
      desired_skills: pendingData.desired_skills || null,
      registered_camps: ['YC26'],
      last_registered_camp: 'YC26',
      created_at: timestamp,
      updated_at: timestamp,
    };

    // Create camp registration document
    const campRegData = {
      registration_id: regId,
      member_id: memberId,
      camp_id: 'YC26',
      full_name: pendingData.full_name,
      phone_number: pendingData.phone_number,
      gender: pendingData.gender,
      age: pendingData.age,
      church_name: pendingData.church_name,
      registration_type: registrationType,
      amount_paid: amount,
      payment_mode: 'online',
      payment_status: 'completed',
      payment_transaction_id: transactionId,
      payment_method: 'phonepe',
      payment_completed_at: timestamp,
      yc26_registration_number: newYC26Counter,
      yc26_attended_number: null, // Assigned when ID is printed
      group_name: null, // Assigned when ID is printed
      registered_by: pendingData.registered_by || 'frontdesk',
      collected_faithbox: pendingData.collected_faithbox,
      id_printed: false,
      registration_date: timestamp,
      created_at: timestamp,
      updated_at: timestamp,
    };

    // Create payment record
    const paymentData = {
      payment_id: transactionId,
      registration_id: regId,
      member_id: memberId,
      amount: amount,
      payment_method: 'phonepe',
      payment_status: 'completed',
      transaction_id: transactionId,
      phone_number: pendingData.phone_number,
      payment_date: timestamp,
      phonepe_response: decodedResponse,
      source: 'frontdesk',
      created_at: timestamp,
    };

    // Batch write to Firestore
    const batch = adminDb.batch();

    // Add member document
    const memberRef = adminDb.collection('members').doc(memberId);
    batch.set(memberRef, memberData);

    // Add camp registration document
    const campRegRef = adminDb.collection('camps').doc('YC26').collection('registrations').doc(regId);
    batch.set(campRegRef, campRegData);

    // Add payment document
    const paymentRef = adminDb.collection('payments').doc(transactionId);
    batch.set(paymentRef, paymentData);

    // Update counters
    batch.update(counterRef, {
      memberCounter: newMemberCounter,
      yc26RegistrationCounter: newYC26Counter,
      lastUpdated: timestamp,
    });

    // Update pending registration status to completed
    batch.update(pendingRegRef, {
      payment_status: 'completed',
      status: 'completed',
      member_id: memberId,
      registration_id: regId,
      completed_at: timestamp,
    });

    // Commit batch
    await batch.commit();
    console.log('✅ Successfully created member:', memberId, 'and registration:', regId);

    // Create audit log
    await adminDb.collection('audit_logs').add({
      action: 'frontdesk_registration_created_with_payment',
      resource_type: 'registration',
      resource_id: regId,
      actor_type: 'system',
      actor_id: 'frontdesk_payment_callback',
      details: {
        member_id: memberId,
        registration_type: registrationType,
        transaction_id: transactionId,
        amount: amount,
        registered_by: pendingData.registered_by,
      },
      timestamp,
    });

    console.log('Redirecting to success page');
    // Redirect to frontdesk success page
    return NextResponse.redirect(
      new URL(
        `/frontdesk/payment-callback?status=success&member_id=${memberId}&registration_id=${regId}&reg_number=${newYC26Counter}&transaction=${transactionId}`,
        request.url
      )
    );
  } catch (error) {
    console.error('Frontdesk payment callback error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.redirect(
      new URL('/frontdesk/payment-callback?error=processing_failed', request.url)
    );
  }
}

// Handle GET request for manual status check
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const transactionId = searchParams.get('transaction_id');

  if (!transactionId) {
    return NextResponse.json(
      { error: 'Transaction ID required' },
      { status: 400 }
    );
  }

  try {
    const statusResponse = await checkPhonePeOrderStatus(transactionId);
    return NextResponse.json(statusResponse);
  } catch {
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
