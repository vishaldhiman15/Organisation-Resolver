import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Issue from '@/models/Issue';
import Notification from '@/models/Notification';
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

    // Only heads can update status
    if (user.role !== 'head') {
      return NextResponse.json({ error: 'Only organization heads can update issue status' }, { status: 403 });
    }

    const { status } = await req.json();
    const validStatuses = ['open', 'in-progress', 'resolved'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }

    await dbConnect();
    const issue = await Issue.findById(resolvedParams.id);

    if (!issue) {
      return NextResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    if (issue.organizationId.toString() !== user.organizationId) {
      return NextResponse.json({ error: 'Not authorized for this issue' }, { status: 403 });
    }

    issue.status = status;
    issue.updatedAt = new Date();
    await issue.save();

    // Notify issue author
    await Notification.create({
      userId: issue.authorId,
      organizationId: user.organizationId,
      title: 'Issue Status Updated',
      message: `Your issue "${issue.title}" is now ${status}.`,
      link: `/dashboard/issue/${issue._id}`
    });

    return NextResponse.json({ success: true, data: issue });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
