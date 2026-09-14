import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import User from '@/models/User';
import Notification from '@/models/Notification';

export async function GET(request) {
  try {
    const token = request.cookies.get('token')?.value;
    const user = token ? verifyToken(token) : null;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    let query = { organizationId: user.organizationId };
    
    // If employee, only get their assigned tasks OR pending tasks matching their specialization
    if (user.role === 'employee') {
      const dbUser = await User.findById(user.id);
      query.$or = [
        { assigneeId: user.id },
        { status: 'pending', category: dbUser.specialization || 'General' }
      ];
    }

    const tasks = await Task.find(query)
      .populate('assigneeId', 'name email branch')
      .sort({ createdAt: -1 });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Fetch tasks error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get('token')?.value;
    const user = token ? verifyToken(token) : null;
    if (!user || user.role !== 'head') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, assigneeId, category } = await request.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Please provide title and description' },
        { status: 400 }
      );
    }

    await connectDB();

    const task = await Task.create({
      title,
      description,
      organizationId: user.organizationId,
      assigneeId: assigneeId || null,
      category: category || 'General',
      status: assigneeId ? 'assigned' : 'pending'
    });

    // If assigned immediately, update user's workStatus and send notification
    if (assigneeId) {
      await User.findByIdAndUpdate(assigneeId, { workStatus: 'working' });
      await Notification.create({
        userId: assigneeId,
        organizationId: user.organizationId,
        title: 'New Task Assigned',
        message: `You have been assigned a new task: ${title}`,
        link: '/dashboard/tasks'
      });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Create task error:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
