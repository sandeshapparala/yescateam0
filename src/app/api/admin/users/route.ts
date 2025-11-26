// Admin Users API Route
// Create, list, update, and delete admin/frontdesk users
// Only accessible by super_admin

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Timestamp } from 'firebase-admin/firestore';

// Role type
type RoleType = 'super_admin' | 'admin' | 'front_desk';

interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: RoleType;
  permissions?: string[];
}

// Default permissions by role
const DEFAULT_PERMISSIONS: Record<RoleType, string[]> = {
  super_admin: [
    'manage_users',
    'manage_registrations',
    'manage_members',
    'manage_payments',
    'manage_settings',
    'view_reports',
    'manage_camps',
  ],
  admin: [
    'manage_registrations',
    'manage_members',
    'manage_payments',
    'view_reports',
  ],
  front_desk: [
    'manage_registrations',
    'view_members',
    'print_id_cards',
  ],
};

// GET - List all users with roles
export async function GET() {
  try {
    // Get all roles from Firestore
    const rolesSnapshot = await adminDb.collection('roles').get();
    
    const users = rolesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email,
        name: data.name,
        role: data.role,
        permissions: data.permissions || [],
        active: data.active ?? true,
        assigned_on: data.assigned_on?.toDate?.()?.toISOString() || null,
        assigned_by: data.assigned_by || null,
      };
    });

    return NextResponse.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST - Create a new user
export async function POST(request: NextRequest) {
  try {
    const body: CreateUserRequest = await request.json();
    const { email, password, name, role, permissions } = body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Email, password, name, and role are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password (minimum 6 characters)
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['super_admin', 'admin', 'front_desk'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be super_admin, admin, or front_desk' },
        { status: 400 }
      );
    }

    // Create Firebase Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      emailVerified: true, // Auto-verify for admin-created users
    });

    // Create role document in Firestore
    const roleData = {
      uid: userRecord.uid,
      email: email.toLowerCase(),
      name,
      role,
      permissions: permissions || DEFAULT_PERMISSIONS[role],
      active: true,
      assigned_by: 'super_admin', // TODO: Get from auth header
      assigned_on: Timestamp.now(),
      created_at: Timestamp.now(),
    };

    await adminDb.collection('roles').doc(userRecord.uid).set(roleData);

    // Create audit log
    await adminDb.collection('audit_logs').add({
      action: 'user_created',
      resource_type: 'user',
      resource_id: userRecord.uid,
      actor_type: 'admin',
      actor_id: 'super_admin',
      details: {
        email,
        name,
        role,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        name,
        role,
      },
      message: 'User created successfully',
    });
  } catch (error) {
    console.error('Error creating user:', error);
    
    const firebaseError = error as { code?: string; message?: string };
    
    // Handle specific Firebase Auth errors
    if (firebaseError.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 400 }
      );
    }
    if (firebaseError.code === 'auth/invalid-email') {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }
    if (firebaseError.code === 'auth/weak-password') {
      return NextResponse.json(
        { error: 'Password is too weak' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create user', details: firebaseError.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete a user
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get('uid');

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get user data before deletion for audit
    const roleDoc = await adminDb.collection('roles').doc(uid).get();
    const userData = roleDoc.data();

    // Delete from Firebase Auth
    await adminAuth.deleteUser(uid);

    // Delete role document
    await adminDb.collection('roles').doc(uid).delete();

    // Create audit log
    await adminDb.collection('audit_logs').add({
      action: 'user_deleted',
      resource_type: 'user',
      resource_id: uid,
      actor_type: 'admin',
      actor_id: 'super_admin',
      details: {
        email: userData?.email,
        name: userData?.name,
        role: userData?.role,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    
    const firebaseError = error as { code?: string };
    if (firebaseError.code === 'auth/user-not-found') {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

// PATCH - Update user (toggle active, update role)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { uid, updates } = body;

    if (!uid) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get current role data
    const roleRef = adminDb.collection('roles').doc(uid);
    const roleDoc = await roleRef.get();

    if (!roleDoc.exists) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const currentData = roleDoc.data();

    // Prepare update object
    const updateData: Record<string, unknown> = {
      updated_at: Timestamp.now(),
    };

    // Update allowed fields
    if (updates.active !== undefined) {
      updateData.active = updates.active;
      
      // Disable/enable Firebase Auth user
      await adminAuth.updateUser(uid, {
        disabled: !updates.active,
      });
    }

    if (updates.role && ['super_admin', 'admin', 'front_desk'].includes(updates.role)) {
      updateData.role = updates.role;
      updateData.permissions = updates.permissions || DEFAULT_PERMISSIONS[updates.role as RoleType];
    }

    if (updates.name) {
      updateData.name = updates.name;
      await adminAuth.updateUser(uid, {
        displayName: updates.name,
      });
    }

    // Update Firestore
    await roleRef.update(updateData);

    // Create audit log
    await adminDb.collection('audit_logs').add({
      action: 'user_updated',
      resource_type: 'user',
      resource_id: uid,
      actor_type: 'admin',
      actor_id: 'super_admin',
      details: {
        previous: currentData,
        updates,
      },
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
