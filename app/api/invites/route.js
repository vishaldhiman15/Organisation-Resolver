import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import dbConnect from '@/lib/mongodb';
import Invite from '@/models/Invite';
import Organization from '@/models/Organization';
import { verifyToken } from '@/lib/auth';

function getUser(req) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

// GET /api/invites — list all invites for this org (head only)
export async function GET(req) {
  try {
    const user = getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'head') return NextResponse.json({ error: 'Only organization heads can view invites' }, { status: 403 });

    await dbConnect();

    const invites = await Invite.find({ organizationId: user.organizationId })
      .populate('usedBy', 'name email')
      .sort({ createdAt: -1 });

    const now = new Date();
    const enriched = invites.map((inv) => ({
      _id: inv._id,
      token: inv.token,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
      usedAt: inv.usedAt,
      usedBy: inv.usedBy,
      status: inv.usedAt ? 'used' : inv.expiresAt < now ? 'expired' : 'pending',
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

// POST /api/invites — generate a new invite link (head only)
export async function POST(req) {
  try {
    const user = getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'head') return NextResponse.json({ error: 'Only organization heads can generate invites' }, { status: 403 });

    await dbConnect();

    // Check pending invite count (rate-limit to 20 active invites at once)
    const pendingCount = await Invite.countDocuments({
      organizationId: user.organizationId,
      usedAt: null,
      expiresAt: { $gt: new Date() },
    });

    if (pendingCount >= 20) {
      return NextResponse.json({ error: 'You have 20 active invites already. Wait for some to expire or be used.' }, { status: 429 });
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const invite = await Invite.create({
      token,
      organizationId: user.organizationId,
      createdBy: user.id,
      expiresAt,
    });

    // Build full join URL from request origin
    const origin = req.headers.get('origin') || req.headers.get('host') || 'http://localhost:3000';
    const baseUrl = origin.startsWith('http') ? origin : `https://${origin}`;
    const joinUrl = `${baseUrl}/join?token=${token}`;

    return NextResponse.json({ success: true, data: { invite, joinUrl } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
