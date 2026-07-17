import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { requireAuth } from '@/lib/api-auth';

/**
 * POST /api/auth/change-password
 * Body: { currentPassword, newPassword }
 * Verifies the current password, then sets the new one (the User pre-save hook
 * hashes it). Self-service only — userId is token-derived.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = requireAuth(request);
    if (auth.response) return auth.response;
    const userId = auth.user.id;

    await dbConnect();

    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, message: 'Current and new password are required.' }, { status: 400 });
    }
    if (String(newPassword).length < 8) {
      return NextResponse.json({ success: false, message: 'New password must be at least 8 characters.' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    // OAuth-only accounts have no password to verify against.
    if (!user.password) {
      return NextResponse.json({ success: false, message: 'This account has no password set.' }, { status: 400 });
    }

    const valid = await user.comparePassword(currentPassword);
    if (!valid) {
      return NextResponse.json({ success: false, message: 'Current password is incorrect.' }, { status: 400 });
    }

    user.password = newPassword; // pre-save hook hashes it
    await user.save();

    return NextResponse.json({ success: true, message: 'Password updated successfully.' });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ success: false, message: 'Failed to change password.' }, { status: 500 });
  }
}
