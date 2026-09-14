import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invite from '@/models/Invite';
import Organization from '@/models/Organization';

// GET /api/invites/[token] — public: validate a token and return org info
export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    const token = resolvedParams.token;

    await dbConnect();

    const invite = await Invite.findOne({ token }).populate('organizationId', 'name tenantSlug');

    if (!invite) {
      return NextResponse.json({ error: 'Invite link is invalid or does not exist.' }, { status: 404 });
    }

    if (invite.usedAt) {
      return NextResponse.json({ error: 'This invite link has already been used.' }, { status: 410 });
    }

    if (invite.expiresAt < new Date()) {
      return NextResponse.json({ error: 'This invite link has expired. Please ask your organization head for a new one.' }, { status: 410 });
    }

    return NextResponse.json({
      success: true,
      data: {
        organizationId: invite.organizationId._id,
        organizationName: invite.organizationId.name,
        role: invite.role,
        expiresAt: invite.expiresAt,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
