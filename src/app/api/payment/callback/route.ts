// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */

// Payment Callback API - Step 2: Handle PhonePe Response
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { generateMemberId } from '@/lib/firebase/utils';
import { generateRegId } from '@/lib/registration/types';
import { checkPhonePeOrderStatus } from '@/lib/payment/phonepe';
import { sendRegistrationConfirmation } from '@/lib/whatsapp/send-confirmation';

export async function POST(request: NextRequest) {
  try {
    console.log('Payment callback received');
    
    // PhonePe sends data as form-urlencoded
    const phonePeFormData = await request.formData();
    const response = phonePeFormData.get('response') as string;
    
    console.log('PhonePe callback response:', response);
    
    if (!response) {
      console.error('No response data from PhonePe');
      return NextResponse.redirect(
        new URL('/register/payment-failed?error=no_response', request.url)
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
        new URL('/register/payment-failed?error=no_transaction_id', request.url)
      );
    }

    console.log(`Payment status for ${transactionId}: ${paymentStatus}`);

    // Check if this is a donation payment (by transaction ID prefix)
    const isDonation = transactionId.startsWith('DONATE_');
    console.log(`Transaction type: ${isDonation ? 'Donation' : 'Registration'}`);

    // Handle donation payment
    if (isDonation) {
      console.log('Processing donation payment...');
      
      const donationQuery = await adminDb.collection('donations')
        .where('merchant_order_id', '==', transactionId)
        .limit(1)
        .get();

      if (donationQuery.empty) {
        console.error('Donation not found for transaction:', transactionId);
        return NextResponse.redirect(
          new URL(`/donate/payment-failed?error=donation_not_found&transaction=${transactionId}`, request.url)
        );
      }

      const donationDoc = donationQuery.docs[0];
      const donationId = donationDoc.id;

      // Check payment status
      if (paymentStatus !== 'PAYMENT_SUCCESS') {
        console.log('Donation payment not successful, status:', paymentStatus);
        
        // Update donation status to failed
        await donationDoc.ref.update({
          payment_status: 'failed',
          status: 'failed',
          updated_at: Date.now(),
          failure_reason: paymentStatus,
        });
        
        return NextResponse.redirect(
          new URL(`/donate/payment-failed?transaction=${transactionId}&status=${paymentStatus}`, request.url)
        );
      }

      // Payment successful - update donation
      console.log('Donation payment successful!');
      await donationDoc.ref.update({
        payment_status: 'completed',
        status: 'completed',
        payment_completed_at: Date.now(),
        updated_at: Date.now(),
        payment_details: decodedResponse.data,
      });

      console.log('✅ Donation payment completed:', donationId);
      
      return NextResponse.redirect(
        new URL(`/donate/success?donation_id=${donationId}`, request.url)
      );
    }

    // Handle registration payment
    console.log('Processing registration payment...');

    // Check payment status for registration
    if (paymentStatus !== 'PAYMENT_SUCCESS') {
      console.log('Registration payment not successful, status:', paymentStatus);
      return NextResponse.redirect(
        new URL(`/register/payment-failed?transaction=${transactionId}&status=${paymentStatus}`, request.url)
      );
    }

    // Continue with registration payment processing

    // Get pending registration data from YC26 collection
    console.log('Fetching pending registration data for:', transactionId);
    const pendingRegRef = adminDb.collection('camps').doc('YC26').collection('pending_registrations').doc(transactionId);
    const pendingRegDoc = await pendingRegRef.get();

    if (!pendingRegDoc.exists) {
      console.error('Pending registration not found for:', transactionId);
      return NextResponse.redirect(
        new URL(`/register/payment-failed?error=pending_not_found&transaction=${transactionId}`, request.url)
      );
    }

    const pendingData = pendingRegDoc.data()!;
    console.log('Pending registration found, creating member and registration...');
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
      registered_camps: ['YC26'], // Initialize with current camp
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
      registration_type: registrationType,
      registration_date: timestamp,
      payment_status: 'completed',
      payment_amount: amount,
      payment_transaction_id: transactionId,
      payment_method: 'phonepe',
      payment_completed_at: timestamp,
      attendance_status: 'registered',
      group_name: null,
      yc26_registration_number: newYC26Counter,
      yc26_attended_number: null,
      collected_faithbox: registrationType === 'faithbox' ? false : null,
      registered_by: 'online',
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
    console.log('Successfully created member:', memberId, 'and registration:', regId);

    // Send WhatsApp confirmation message
    try {
      const loginUrl = `${process.env.NEXT_PUBLIC_URL}/profile`;
      await sendRegistrationConfirmation(
        formData.phone_number,
        formData.full_name,
        memberId,
        loginUrl
      );
      console.log('✅ WhatsApp confirmation sent to:', formData.phone_number);
    } catch (whatsappError) {
      // Don't fail the registration if WhatsApp fails
      console.error('⚠️ Failed to send WhatsApp confirmation:', whatsappError);
    }

    // Create audit log
    await adminDb.collection('audit_logs').add({
      action: 'registration_created_with_payment',
      resource_type: 'registration',
      resource_id: regId,
      actor_type: 'system',
      actor_id: 'payment_callback',
      details: {
        member_id: memberId,
        registration_type: registrationType,
        transaction_id: transactionId,
        amount: amount,
      },
      timestamp,
    });

    console.log('Redirecting to success page');
    // Redirect to success page with registration details
    return NextResponse.redirect(
      new URL(
        `/register/payment-success?member_id=${memberId}&registration_id=${regId}&transaction=${transactionId}`,
        request.url
      )
    );
  } catch (error) {
    console.error('Payment callback error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.redirect(
      new URL('/register/payment-failed?error=processing_failed', request.url)
    );
  }
}

// Handle GET request for status check
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
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
