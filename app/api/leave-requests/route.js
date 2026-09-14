import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LeaveRequest from '@/models/LeaveRequest';
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

    let query = { organizationId: user.organizationId };
    if (user.role === 'employee') {
      query.userId = user.id;
    }

    const requests = await LeaveRequest.find(query)
      .populate('userId', 'name email avatar')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: requests });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { type, reason, date } = body;

    if (!type || !reason || !date) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    await dbConnect();

    const leaveRequest = await LeaveRequest.create({
      userId: user.id,
      organizationId: user.organizationId,
      type,
      reason,
      date,
      status: 'pending'
    });

    return NextResponse.json({ success: true, data: leaveRequest }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
