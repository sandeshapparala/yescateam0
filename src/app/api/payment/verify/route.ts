// Payment Verification API - Verifies payment status and saves to Firebase
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { generateMemberId } from '@/lib/firebase/utils';
import { generateRegId } from '@/lib/registration/types';
import { checkPhonePeOrderStatus } from '@/lib/payment/phonepe';
import { sendRegistrationConfirmation } from '@/lib/whatsapp/send-confirmation';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const merchantOrderId = searchParams.get('merchant_order_id');

    if (!merchantOrderId) {
      return NextResponse.json(
        { error: 'Merchant order ID required' },
        { status: 400 }
      );
    }

    console.log('Verifying payment for order:', merchantOrderId);

    // Get pending registration data
    const pendingRegRef = adminDb.collection('camps').doc('YC26').collection('pending_registrations').doc(merchantOrderId);
    const pendingRegDoc = await pendingRegRef.get();

    if (!pendingRegDoc.exists) {
      console.error('Pending registration not found');
      return NextResponse.json(
        { error: 'Pending registration not found', success: false },
        { status: 404 }
      );
    }

    const pendingData = pendingRegDoc.data()!;

    // Check if already processed
    if (pendingData.payment_status === 'completed' || pendingData.status === 'completed') {
      console.log('Payment already processed');
      return NextResponse.json({
        success: true,
        state: 'COMPLETED',
        member_id: pendingData.member_id,
        registration_id: pendingData.registration_id,
        message: 'Payment already processed',
      });
    }

    // Check payment status with PhonePe
    console.log('Checking order status...');
    const orderStatus = await checkPhonePeOrderStatus(merchantOrderId);
    console.log('Order status:', JSON.stringify(orderStatus, null, 2));

    // Check if payment was successful
    const paymentSuccess = orderStatus.success && orderStatus.code === 'PAYMENT_SUCCESS';
    const paymentState = orderStatus.data?.state;

    // If payment not completed, update status to failed and return
    if (!paymentSuccess || paymentState !== 'COMPLETED') {
      await pendingRegRef.update({
        payment_status: 'failed',
        status: 'failed',
        payment_state: paymentState || 'UNKNOWN',
        failed_at: new Date().toISOString(),
      });
      return NextResponse.json({
        success: false,
        state: paymentState || 'UNKNOWN',
        message: `Payment ${paymentState?.toLowerCase() || 'failed'}`,
      });
    }

    // Payment completed - save to Firebase
    const registrationType = pendingData.registration_type;
    const timestamp = new Date().toISOString();

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

    console.log('Creating member and registration...', memberId, regId);

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
      payment_amount: pendingData.amount,
      payment_order_id: merchantOrderId,
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
      payment_id: orderStatus.data?.transactionId || merchantOrderId,
      merchant_order_id: merchantOrderId,
      registration_id: regId,
      member_id: memberId,
      amount: pendingData.amount,
      payment_method: 'phonepe',
      payment_status: 'completed',
      phone_number: pendingData.phone_number,
      payment_date: timestamp,
      phonepe_response: orderStatus,
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
    const paymentRef = adminDb.collection('payments').doc(merchantOrderId);
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
    console.log('Successfully saved to Firebase');

    // Send WhatsApp confirmation message
    try {
      await sendRegistrationConfirmation(
        pendingData.phone_number,
        pendingData.full_name,
        memberId
      );
      console.log('✅ WhatsApp confirmation sent to:', pendingData.phone_number);
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
      actor_id: 'payment_verification',
      details: {
        member_id: memberId,
        registration_type: registrationType,
        merchant_order_id: merchantOrderId,
        transaction_id: orderStatus.data?.transactionId,
        amount: pendingData.amount,
      },
      timestamp,
    });

    return NextResponse.json({
      success: true,
      state: 'COMPLETED',
      member_id: memberId,
      registration_id: regId,
      message: 'Payment verified and registration completed',
    });
  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      {
        error: 'Failed to verify payment',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false,
      },
      { status: 500 }
    );
  }
}
