// Frontdesk Payment Initiation API Route
// Creates pending registration and initiates PhonePe payment
// Separate callback URL for frontdesk registrations

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { generateTransactionId, PHONEPE_CONFIG } from '@/lib/payment/phonepe';
import crypto from 'crypto';

// Registration type
type RegistrationType = 'normal' | 'faithbox';

// Generate X-VERIFY header for PhonePe API authentication (with custom callback)
function generateFrontdeskXVerifyHeader(payload: string): string {
  const sha256Hash = crypto
    .createHash('sha256')
    .update(payload + '/pg/v1/pay' + PHONEPE_CONFIG.SALT_KEY)
    .digest('hex');
  
  return `${sha256Hash}###${PHONEPE_CONFIG.SALT_INDEX}`;
}

// Create PhonePe order with frontdesk callback URL
async function createFrontdeskPhonePeOrder(orderData: {
  merchantOrderId: string;
  amount: number; // in paisa
  mobileNumber?: string;
}) {
  const orderUrl = `${PHONEPE_CONFIG.API_BASE_URL}/pg/v1/pay`;
  
  // Use frontdesk-specific callback URLs
  const redirectUrl = `${process.env.NEXT_PUBLIC_URL}/frontdesk/payment-callback?from=phonepe&merchantOrderId=${orderData.merchantOrderId}`;
  const callbackUrl = `${process.env.NEXT_PUBLIC_URL}/api/frontdesk/payment/callback`;
  
  const payload = {
    merchantId: PHONEPE_CONFIG.MERCHANT_ID,
    merchantTransactionId: orderData.merchantOrderId,
    merchantUserId: `MUID${Date.now()}`,
    amount: orderData.amount,
    redirectUrl: redirectUrl,
    callbackUrl: callbackUrl,
    mobileNumber: orderData.mobileNumber || '',
    paymentInstrument: {
      type: 'PAY_PAGE',
    },
  };

  const base64Payload = Buffer.from(JSON.stringify(payload)).toString('base64');
  const xVerify = generateFrontdeskXVerifyHeader(base64Payload);

  const response = await fetch(orderUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-VERIFY': xVerify,
    },
    body: JSON.stringify({
      request: base64Payload,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('PhonePe API Error:', error);
    throw new Error(`Failed to create PhonePe order: ${JSON.stringify(error)}`);
  }

  const result = await response.json();
  
  return {
    success: result.success,
    code: result.code,
    message: result.message,
    merchantTransactionId: orderData.merchantOrderId,
    redirectUrl: result.data?.instrumentResponse?.redirectInfo?.url,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      formData,
      registration_type,
      amount,
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
    };

    if (amount < minAmounts[registration_type]) {
      return NextResponse.json(
        { error: `Minimum amount for ${registration_type} is ₹${minAmounts[registration_type]}` },
        { status: 400 }
      );
    }

    // Generate unique merchant order ID (with FD prefix for frontdesk)
    const merchantOrderId = `FD_${generateTransactionId()}`;
    const timestamp = new Date().toISOString();

    // Save pending registration data before payment
    const pendingRegRef = adminDb.collection('camps').doc('YC26').collection('pending_registrations').doc(merchantOrderId);
    await pendingRegRef.set({
      merchant_order_id: merchantOrderId,
      registration_type: registration_type,
      amount,
      // All form fields
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
      // Frontdesk-specific fields
      collected_faithbox: registration_type === 'faithbox' ? (collected_faithbox || false) : null,
      registered_by: registered_by || 'frontdesk',
      payment_mode: 'online',
      // Payment tracking
      payment_status: 'pending',
      status: 'pending',
      source: 'frontdesk', // Mark as frontdesk registration
      created_at: timestamp,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    });

    console.log('Creating PhonePe order for frontdesk registration...');
    
    // Create payment order with frontdesk callback
    const orderResponse = await createFrontdeskPhonePeOrder({
      merchantOrderId,
      amount: amount * 100, // Convert to paise
      mobileNumber: formData.phone_number,
    });
    
    console.log('PhonePe Order Response:', JSON.stringify(orderResponse, null, 2));

    if (!orderResponse.success) {
      // Update pending registration with failure
      await pendingRegRef.update({
        payment_status: 'failed',
        payment_error: orderResponse.message,
      });
      
      return NextResponse.json(
        { error: 'Failed to create payment order', details: orderResponse.message },
        { status: 500 }
      );
    }

    // Update pending registration with payment state
    await pendingRegRef.update({
      payment_state: 'PENDING',
    });

    // Return redirect URL to open PhonePe checkout
    return NextResponse.json({
      success: true,
      merchant_order_id: merchantOrderId,
      redirect_url: orderResponse.redirectUrl,
      message: 'Payment order created successfully',
    });
  } catch (error) {
    console.error('Frontdesk payment initiation error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
