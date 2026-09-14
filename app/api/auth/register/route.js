import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Organization from '@/models/Organization';
import User from '@/models/User';
import Invite from '@/models/Invite';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();
    const { name, email, password, orgName, orgSlug, role = 'employee', inviteToken } = body;

    let orgId;
    let invite = null;

    if (role === 'head') {
      // Heads create the org — no invite needed
      if (!orgName || !orgSlug) {
        return NextResponse.json({ error: 'Organization name and slug are required for heads' }, { status: 400 });
      }
      const existingOrg = await Organization.findOne({ tenantSlug: orgSlug });
      if (existingOrg) {
        return NextResponse.json({ error: 'Organization slug already in use' }, { status: 400 });
      }
      const org = await Organization.create({ name: orgName, tenantSlug: orgSlug });
      orgId = org._id;
    } else {
      // Employees MUST have a valid invite token
      if (!inviteToken) {
        return NextResponse.json({ error: 'An invite link is required to join an organization.' }, { status: 403 });
      }

      invite = await Invite.findOne({ token: inviteToken });

      if (!invite) {
        return NextResponse.json({ error: 'Invite link is invalid.' }, { status: 403 });
      }
      if (invite.usedAt) {
        return NextResponse.json({ error: 'This invite link has already been used.' }, { status: 403 });
      }
      if (invite.expiresAt < new Date()) {
        return NextResponse.json({ error: 'This invite link has expired. Ask your admin for a new one.' }, { status: 403 });
      }

      orgId = invite.organizationId;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      passwordHash,
      role: role === 'head' ? 'head' : 'employee',
      organizationId: orgId,
    });

    // Consume the invite
    if (invite) {
      invite.usedAt = new Date();
      invite.usedBy = user._id;
      await invite.save();
    }

    const token = signToken({ id: user._id, role: user.role, organizationId: user.organizationId.toString() });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
