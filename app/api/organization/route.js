import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Organization from '@/models/Organization';
import { verifyToken } from '@/lib/auth';

function getUser(req) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req) {
  try {
    const user = getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const org = await Organization.findById(user.organizationId);
    
    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: org });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const user = getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'head') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { latitude, longitude, radius } = body;

    await dbConnect();
    const org = await Organization.findById(user.organizationId);

    if (!org) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    org.location = {
      latitude: latitude !== undefined ? latitude : org.location?.latitude,
      longitude: longitude !== undefined ? longitude : org.location?.longitude,
      radius: radius !== undefined ? radius : org.location?.radius || 200,
    };

    await org.save();
    return NextResponse.json({ success: true, data: org });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
