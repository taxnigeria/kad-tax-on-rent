import { NextRequest, NextResponse } from 'next/server';
import { verifyRecaptcha } from '@/app/actions/verify-recaptcha';

export async function POST(request: NextRequest) {
  try {
    const { token, action } = await request.json();

    if (!token || !action) {
      return NextResponse.json(
        { success: false, error: 'Token and action are required' },
        { status: 400 }
      );
    }

    const verificationResult = await verifyRecaptcha(token, action);

    if (!verificationResult.success) {
      return NextResponse.json(
        { success: false, error: verificationResult.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error verifying reCAPTCHA:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
