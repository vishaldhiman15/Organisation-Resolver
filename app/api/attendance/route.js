import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import Organization from '@/models/Organization';
import LeaveRequest from '@/models/LeaveRequest';
import { verifyToken } from '@/lib/auth';

function getUser(req) {
  const token = req.cookies.get('token')?.value;
  if (!token) return null;
  return verifyToken(token);
}

function getTodayString() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

// Haversine formula
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; 
  return d;
}

export async function POST(req) {
  try {
    const user = getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { action, latitude, longitude } = body;

    if (!action || !['checkIn', 'checkOut'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    if (latitude == null || longitude == null) {
      return NextResponse.json({ error: 'Location is required for attendance' }, { status: 400 });
    }

    await dbConnect();
    const todayStr = getTodayString();
    
    const org = await Organization.findById(user.organizationId);
    if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    const requests = await LeaveRequest.find({ userId: user.id, date: todayStr, status: 'approved' });
    const hasRemote = requests.some(r => r.type === 'remote');
    const hasEarlyLeave = requests.some(r => r.type === 'early_leave');

    // Distance check
    let isOutOfBounds = false;
    if (!hasRemote) {
      if (org.location && org.location.latitude != null && org.location.longitude != null) {
        const distance = getDistanceFromLatLonInMeters(latitude, longitude, org.location.latitude, org.location.longitude);
        if (distance > (org.location.radius || 200)) {
          isOutOfBounds = true;
        }
      }
    }

    if (action === 'checkIn') {
      if (isOutOfBounds) {
         return NextResponse.json({ error: 'You are outside the company radius. Please submit a Remote Work request if you are not at the office.' }, { status: 403 });
      }

      const existing = await Attendance.findOne({ userId: user.id, date: todayStr });
      if (existing) {
        return NextResponse.json({ error: 'Already checked in for today' }, { status: 400 });
      }

      const attendance = await Attendance.create({
        userId: user.id,
        organizationId: user.organizationId,
        date: todayStr,
        status: 'present',
        checkInTime: new Date(),
        checkInLocation: { latitude, longitude }
      });

      return NextResponse.json({ success: true, data: attendance }, { status: 201 });
    } 
    else if (action === 'checkOut') {
      const attendance = await Attendance.findOne({ userId: user.id, date: todayStr });
      if (!attendance) {
        return NextResponse.json({ error: 'You must check in first.' }, { status: 400 });
      }
      if (attendance.checkOutTime) {
        return NextResponse.json({ error: 'Already checked out for today' }, { status: 400 });
      }

      // Check if leaving early
      let newStatus = attendance.status;
      const hoursWorked = (new Date() - new Date(attendance.checkInTime)) / (1000 * 60 * 60);
      if (hoursWorked < 8 && !hasEarlyLeave) {
        newStatus = 'left_early';
      }

      attendance.checkOutTime = new Date();
      attendance.checkOutLocation = { latitude, longitude };
      attendance.status = newStatus;
      await attendance.save();

      return NextResponse.json({ success: true, data: attendance });
    }

  } catch (error) {
    if (error.code === 11000) {
      return NextResponse.json({ error: 'Already checked in for today' }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}

export async function GET(req) {
  try {
    const user = getUser(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await dbConnect();

    if (user.role === 'employee') {
      const todayStr = getTodayString();
      const history = await Attendance.find({ userId: user.id }).sort({ date: -1 });
      return NextResponse.json({ success: true, data: history, date: todayStr });
    } else if (user.role === 'head') {
      const todayStr = getTodayString();
      
      const employees = await User.find({ 
        organizationId: user.organizationId, 
        role: 'employee' 
      }).select('name avatar email role');

      const todayAttendances = await Attendance.find({
        organizationId: user.organizationId,
        date: todayStr
      });

      const attendanceMap = new Map(todayAttendances.map(a => [a.userId.toString(), a]));

      const result = employees.map(emp => {
        const att = attendanceMap.get(emp._id.toString());
        return {
          user: emp,
          present: !!att,
          status: att ? att.status : 'absent',
          checkInTime: att ? att.checkInTime : null,
          checkOutTime: att ? att.checkOutTime : null,
          checkInLocation: att ? att.checkInLocation : null,
          checkOutLocation: att ? att.checkOutLocation : null
        };
      });

      return NextResponse.json({ success: true, data: result, date: todayStr });
    }

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
