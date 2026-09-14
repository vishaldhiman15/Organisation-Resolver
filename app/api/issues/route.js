import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Issue from '@/models/Issue';
import { verifyToken } from '@/lib/auth';
import { uploadBufferToCloudinary } from '@/lib/cloudinary';

function getUser(req) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req) {
  try {
    const user = getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const view = searchParams.get('view') || 'public'; // 'public' | 'private'

    await dbConnect();

    const query = { organizationId: user.organizationId };
    let sortOptions = { createdAt: -1 };

    if (view === 'public') {
      query.visibility = 'public';
      sortOptions = { upvoteCount: -1, createdAt: -1 };
    } else {
      query.visibility = 'private';
      // If employee, they only see their own private ones
      if (user.role !== 'head') {
        query.authorId = user.id;
      }
    }

    const issues = await Issue.find(query)
      .populate('authorId', 'name avatar')
      .sort(sortOptions);

    return NextResponse.json({ success: true, count: issues.length, data: issues });
  } catch (error) {
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const title = formData.get('title');
    const description = formData.get('description');
    const visibility = formData.get('visibility') || 'private';

    if (!title || !description) {
      return NextResponse.json({ error: 'Title and description are required' }, { status: 400 });
    }

    const attachments = [];
    const files = formData.getAll('attachments');
    
    for (const file of files) {
      if (file && typeof file.arrayBuffer === 'function') {
        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadBufferToCloudinary(buffer, 'helpbuddy/issues');
        attachments.push(result.secure_url);
      }
    }

    await dbConnect();
    const issue = await Issue.create({
      title,
      description,
      visibility,
      authorId: user.id,
      organizationId: user.organizationId,
      attachments
    });

    return NextResponse.json({ success: true, data: issue }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
