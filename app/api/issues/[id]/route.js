import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Issue from '@/models/Issue';
import { verifyToken } from '@/lib/auth';

function getUser(req) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req, { params }) {
  try {
    const resolvedParams = await params;
    const user = getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    const issue = await Issue.findById(resolvedParams.id).populate('authorId', 'name avatar');
    
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    // Tenant check
    if (issue.organizationId.toString() !== user.organizationId) {
      return NextResponse.json({ error: 'Not authorized for this issue' }, { status: 403 });
    }

    // Permission check for private issues
    if (issue.visibility === 'private' && user.role !== 'head' && issue.authorId._id.toString() !== user.id) {
       return NextResponse.json({ error: 'Not authorized for this private issue' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: issue });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const resolvedParams = await params;
    const user = getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { status, approvalStatus } = await req.json();

    await dbConnect();
    const issue = await Issue.findById(resolvedParams.id);
    
    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    if (issue.organizationId.toString() !== user.organizationId) {
      return NextResponse.json({ error: 'Not authorized for this issue' }, { status: 403 });
    }

    // Only admins can approve or reject
    if (approvalStatus && user.role === 'head') {
      issue.approvalStatus = approvalStatus;
    }

    if (status) {
      // Allow author or admin to update status
      if (user.role === 'head' || issue.authorId.toString() === user.id) {
        issue.status = status;
      }
    }

    issue.updatedAt = Date.now();
    await issue.save();

    return NextResponse.json({ success: true, data: issue });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
