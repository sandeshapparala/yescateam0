// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
/* eslint-disable */

// Generate ID Card API Route
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { registration_id, collected_faithbox } = await request.json();

    if (!registration_id) {
      return NextResponse.json(
        { error: 'Missing registration_id' },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();

    // Get registration to check if already generated
    const regRef = adminDb
      .collection('camps')
      .doc('YC26')
      .collection('registrations')
      .doc(registration_id);

    const regDoc = await regRef.get();
    const regData = regDoc.data();

    if (!regData) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      );
    }

    const isRegenerate = regData.id_card_printed === true;
    let autoAssignedGroup = regData.group_name;
    let attendedNumber = regData.yc26_attended_number;

    // Only increment counter and assign team if generating for the FIRST time
    if (!isRegenerate) {
      // Get and increment yc26AttendedCounter
      const counterRef = adminDb.collection('settings').doc('counters');
      const counterDoc = await counterRef.get();
      const counters = counterDoc.data() || {};
      const currentAttendedCounter = counters.yc26AttendedCounter || 0;
      const newAttendedCounter = currentAttendedCounter + 1;

      // Auto-assign team based on attended counter (1-30 cycle)
      const TEAMS = [
        'Team Genesis', 'Team Exodus', 'Team Numbers', 'Team Joshua', 'Team Judges',
        'Team Ruth', 'Team Samuel', 'Team Kings', 'Team Chronicles', 'Team Ezra',
        'Team Nehemiah', 'Team Esther', 'Team Job', 'Team Psalms', 'Team Proverbs',
        'Team Solomon', 'Team Isaiah', 'Team Jeremiah', 'Team Ezekiel', 'Team Daniel',
        'Team Hosea', 'Team Joel', 'Team Amos', 'Team Obadiah', 'Team Jonah',
        'Team Micah', 'Team Habakkuk', 'Team Haggai', 'Team Zechariah', 'Team Malachi'
      ];
      const teamIndex = (newAttendedCounter - 1) % 30; // 1->Genesis, 2->Exodus, ..., 30->Malachi, 31->Genesis
      autoAssignedGroup = TEAMS[teamIndex];
      attendedNumber = newAttendedCounter;

      // Batch update: registration and counter
      const batch = adminDb.batch();
      
      const updateData: any = {
        group_name: autoAssignedGroup, // Auto-assigned based on attended counter
        yc26_attended_number: attendedNumber, // Attended sequence number
        id_card_printed: true,
        id_card_printed_at: timestamp,
        attendance_status: 'checked_in', // Mark as checked in when ID is generated
        updated_at: timestamp,
      };

      // Only update faithbox status if it's a faithbox registration
      if (collected_faithbox !== undefined) {
        updateData.collected_faithbox = collected_faithbox;
        updateData.faithbox_collected_at = collected_faithbox ? timestamp : null;
      }

      batch.update(regRef, updateData);
      batch.update(counterRef, {
        yc26AttendedCounter: newAttendedCounter,
        lastUpdated: timestamp,
      });

      await batch.commit();
    } else {
      // Re-generate: Only update faithbox status and last generated time if needed
      const updateData: any = {
        id_card_printed_at: timestamp, // Update last generated time
        updated_at: timestamp,
      };

      // Only update faithbox status if provided and it's a faithbox registration
      if (collected_faithbox !== undefined) {
        updateData.collected_faithbox = collected_faithbox;
        updateData.faithbox_collected_at = collected_faithbox ? timestamp : null;
      }

      await regRef.update(updateData);
    }

    // Create audit log
    await adminDb.collection('audit_logs').add({
      action: isRegenerate ? 'id_card_regenerated' : 'id_card_generated',
      resource_type: 'registration',
      resource_id: registration_id,
      actor_type: 'admin',
      actor_id: 'front_desk', // TODO: Get actual user ID from auth
      details: {
        group_name: autoAssignedGroup,
        attended_number: attendedNumber,
        collected_faithbox,
        is_regenerate: isRegenerate,
      },
      timestamp,
    });

    return NextResponse.json({
      success: true,
      message: isRegenerate ? 'ID card re-generated successfully' : 'ID card generated successfully',
      group_name: autoAssignedGroup,
      attended_number: attendedNumber,
      is_regenerate: isRegenerate,
    });
  } catch (error) {
    console.error('Print ID error:', error);
    return NextResponse.json(
      { error: 'Failed to update registration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
