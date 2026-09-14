import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import LeaveRequest from '@/models/LeaveRequest';
import { verifyToken } from '@/lib/auth';

function getUser(req) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function PATCH(req, { params }) {
  try {
    const resolvedParams = await params;
    const user = getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'head') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { status } = body; // 'approved' or 'rejected'

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    await dbConnect();
    const leaveRequest = await LeaveRequest.findById(resolvedParams.id);

    if (!leaveRequest || leaveRequest.organizationId.toString() !== user.organizationId) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    leaveRequest.status = status;
    await leaveRequest.save();

    return NextResponse.json({ success: true, data: leaveRequest });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
