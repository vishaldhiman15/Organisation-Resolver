import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken } from '@/lib/auth';

export async function GET(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Token is invalid' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(decoded.id).populate('organizationId', 'name tenantSlug companyLogo');

    if (!user) {
      return NextResponse.json({ error: 'User no longer exists' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const token = req.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'Not authorized' }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ error: 'Token is invalid' }, { status: 401 });

    const { specialization } = await req.json();

    await dbConnect();
    const user = await User.findById(decoded.id);
    if (!user) return NextResponse.json({ error: 'User no longer exists' }, { status: 401 });

    if (specialization) {
      user.specialization = specialization;
    }

    await user.save();

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
