import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Task from '@/models/Task';
import Attendance from '@/models/Attendance';

export async function GET(request, { params }) {
  try {
    const token = request.cookies.get('token')?.value;
    const user = token ? verifyToken(token) : null;
    if (!user || user.role !== 'head') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const resolvedParams = await params;
    
    // Fetch employee data
    const employee = await User.findOne({
      _id: resolvedParams.id,
      organizationId: user.organizationId
    }).select('-passwordHash');

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    // Fetch employee's tasks
    const tasks = await Task.find({ assigneeId: employee._id }).sort({ createdAt: -1 });
    
    // Fetch employee's attendance
    const attendance = await Attendance.find({ userId: employee._id }).sort({ date: -1 });

    return NextResponse.json({ 
      employee,
      tasks,
      attendance
    });
  } catch (error) {
    console.error('Fetch employee details error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch employee details' },
      { status: 500 }
    );
  }
}
