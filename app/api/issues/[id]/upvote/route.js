import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Issue from '@/models/Issue';
import { verifyToken } from '@/lib/auth';

function getUser(req) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function POST(req, { params }) {
  try {
    const resolvedParams = await params;
    const user = getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    
    const issue = await Issue.findById(resolvedParams.id);
    if (!issue || issue.organizationId.toString() !== user.organizationId) {
      return NextResponse.json({ error: 'Not authorized or Issue not found' }, { status: 403 });
    }

    if (issue.visibility !== 'public') {
      return NextResponse.json({ error: 'Can only upvote public issues' }, { status: 400 });
    }

    const upvoteIndex = issue.upvotes.indexOf(user.id);
    if (upvoteIndex === -1) {
      // Add upvote
      issue.upvotes.push(user.id);
    } else {
      // Remove upvote
      issue.upvotes.splice(upvoteIndex, 1);
    }

    issue.upvoteCount = issue.upvotes.length;
    await issue.save();

    return NextResponse.json({ success: true, count: issue.upvotes.length });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
