import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Notification from '@/models/Notification';
import { verifyToken } from '@/lib/auth';

function getUser(req) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req) {
  try {
    const user = getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    
    // Fetch notifications for the user
    const notifications = await Notification.find({ userId: user.id })
      .sort({ createdAt: -1 })
      .limit(50);
      
    // Count unread
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return NextResponse.json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    console.error('Notification fetch error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const user = getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();
    
    const body = await req.json();
    const { notificationId } = body;
    
    if (notificationId) {
      // Mark specific notification as read
      await Notification.findOneAndUpdate(
        { _id: notificationId, userId: user.id },
        { isRead: true }
      );
    } else {
      // Mark all as read
      await Notification.updateMany(
        { userId: user.id, isRead: false },
        { isRead: true }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification update error:', error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
