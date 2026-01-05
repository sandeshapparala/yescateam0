// Volunteer Registration API - Payment Initiation
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { createPhonePeOrder } from '@/lib/payment/phonepe';
import { z } from 'zod';

// Volunteer registration schema
const volunteerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  phone_number: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  age: z.coerce.number().min(16, 'Must be at least 16 years old').max(60, 'Must be under 60 years old'),
  church_name: z.string().min(2, 'Church name is required'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate form data
    const validationResult = volunteerSchema.safeParse(body.formData);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const formData = validationResult.data;
    
    // Get amount from request (variable pricing with minimum 300)
    const amount = body.amount || 300;
    const minAmount = 300;
    const maxAmount = 100000;
    
    if (amount < minAmount || amount > maxAmount) {
      return NextResponse.json(
        { error: `Amount must be between ₹${minAmount} and ₹${maxAmount}` },
        { status: 400 }
      );
    }

    // Generate unique merchant order ID with VOLUNTEER prefix
    const merchantOrderId = `VOLUNTEER_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    const timestamp = new Date().toISOString();

    // Save form data to pending_volunteers before payment
    const pendingRef = adminDb
      .collection('camps')
      .doc('YC26')
      .collection('pending_volunteers')
      .doc(merchantOrderId);

    await pendingRef.set({
      merchant_order_id: merchantOrderId,
      amount,
      full_name: formData.full_name,
      phone_number: formData.phone_number,
      age: formData.age,
      church_name: formData.church_name,
      address: formData.address,
      payment_status: 'pending',
      status: 'pending',
      created_at: timestamp,
      expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes
    });

    console.log('Creating PhonePe order for volunteer registration...');
    
    // Create payment order
    const orderResponse = await createPhonePeOrder({
      merchantOrderId,
      amount: amount * 100, // Convert to paise
      mobileNumber: formData.phone_number,
    });
    
    console.log('PhonePe Order Response:', JSON.stringify(orderResponse, null, 2));

    if (!orderResponse.success) {
      return NextResponse.json(
        { error: 'Failed to create payment order', details: orderResponse.message },
        { status: 500 }
      );
    }

    // Update pending volunteer with payment state
    await pendingRef.update({
      payment_state: 'PENDING',
    });

    return NextResponse.json({
      success: true,
      merchant_order_id: merchantOrderId,
      redirect_url: orderResponse.redirectUrl,
      message: 'Payment order created successfully',
    });
  } catch (error) {
    console.error('Volunteer registration error:', error);
    return NextResponse.json(
      { error: 'Failed to initiate payment', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
