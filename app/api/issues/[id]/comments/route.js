import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Comment from '@/models/Comment';
import Issue from '@/models/Issue';
import { verifyToken } from '@/lib/auth';
import { uploadBufferToCloudinary } from '@/lib/cloudinary';

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
    // Validate issue exists and user has access
    const issue = await Issue.findById(resolvedParams.id);
    if (!issue || issue.organizationId.toString() !== user.organizationId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const comments = await Comment.find({ issueId: resolvedParams.id })
      .populate('authorId', 'name avatar')
      .sort({ createdAt: 1 });

    return NextResponse.json({ success: true, count: comments.length, data: comments });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const resolvedParams = await params;
    const user = getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    // Validate access
    const issue = await Issue.findById(resolvedParams.id);
    if (!issue || issue.organizationId.toString() !== user.organizationId) {
       return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const formData = await req.formData();
    const content = formData.get('content');

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const attachments = [];
    const files = formData.getAll('attachments');
    for (const file of files) {
      if (file && typeof file.arrayBuffer === 'function') {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadBufferToCloudinary(buffer, 'helpbuddy/comments');
        attachments.push(result.secure_url);
      }
    }

    const comment = await Comment.create({
      issueId: resolvedParams.id,
      authorId: user.id,
      content,
      attachments
    });

    await comment.populate('authorId', 'name avatar');

    return NextResponse.json({ success: true, data: comment }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
