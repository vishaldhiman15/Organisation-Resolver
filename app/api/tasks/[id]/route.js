import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Task from '@/models/Task';
import User from '@/models/User';

export async function PATCH(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    const user = token ? verifyToken(token) : null;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status, report, assigneeId } = await request.json();

    await connectDB();

    const task = await Task.findOne({
      _id: params.id,
      organizationId: user.organizationId
    });

    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    // Admins can assign tasks
    if (user.role === 'head' && assigneeId) {
      task.assigneeId = assigneeId;
      task.status = 'assigned';
      await User.findByIdAndUpdate(assigneeId, { workStatus: 'working' });
    }

    // Employees can update status and add report
    if (user.role === 'employee') {
      if (task.assigneeId.toString() !== user.id.toString()) {
        return NextResponse.json({ error: 'Not authorized for this task' }, { status: 403 });
      }
      if (status) task.status = status;
      if (report) task.report = report;

      // Update employee status based on task status
      if (status === 'completed') {
        await User.findByIdAndUpdate(user.id, { 
          workStatus: 'free',
          $inc: { performanceScore: 10 } // Increase score by 10 for completing a task
        });
      }
    }

    task.updatedAt = Date.now();
    await task.save();

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Update task error:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}
