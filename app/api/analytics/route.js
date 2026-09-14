import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Issue from '@/models/Issue';
import Comment from '@/models/Comment';
import User from '@/models/User';
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

    // Only heads can view analytics
    if (user.role !== 'head') {
      return NextResponse.json({ error: 'Only organization heads can view analytics' }, { status: 403 });
    }

    await dbConnect();

    const orgId = user.organizationId;

    // Run all queries in parallel for performance
    const [
      totalIssues,
      openIssues,
      inProgressIssues,
      resolvedIssues,
      publicIssues,
      privateIssues,
      topUpvotedIssues,
      recentActivity,
      memberCount,
      recentReports,
    ] = await Promise.all([
      Issue.countDocuments({ organizationId: orgId }),
      Issue.countDocuments({ organizationId: orgId, status: 'open' }),
      Issue.countDocuments({ organizationId: orgId, status: 'in-progress' }),
      Issue.countDocuments({ organizationId: orgId, status: 'resolved' }),
      Issue.countDocuments({ organizationId: orgId, visibility: 'public' }),
      Issue.countDocuments({ organizationId: orgId, visibility: 'private' }),
      Issue.find({ organizationId: orgId, visibility: 'public' })
        .sort({ upvoteCount: -1 })
        .limit(5)
        .populate('authorId', 'name'),
      Issue.find({ organizationId: orgId })
        .sort({ updatedAt: -1 })
        .limit(8)
        .populate('authorId', 'name')
        .select('title status visibility updatedAt authorId upvoteCount'),
      User.countDocuments({ organizationId: orgId }),
      import('@/models/Task').then(mod => mod.default.find({ 
        organizationId: orgId, 
        report: { $ne: '', $exists: true } 
      })
      .sort({ updatedAt: -1 })
      .limit(5)
      .populate('assigneeId', 'name email branch')),
    ]);

    // Build last-30-days trend: group issues by day of creation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

    const trendRaw = await Issue.aggregate([
      {
        $match: {
          organizationId: { $exists: true },
          createdAt: { $gte: thirtyDaysAgo },
          // We can't easily match ObjectId in agg without importing; filter in app
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Filter to org only (aggregate doesn't have easy string compare for org)
    const allOrgIssues = await Issue.find({
      organizationId: orgId,
      createdAt: { $gte: thirtyDaysAgo },
    }).select('createdAt');

    // Build a map of date -> count
    const trendMap = {};
    for (const issue of allOrgIssues) {
      const day = issue.createdAt.toISOString().slice(0, 10);
      trendMap[day] = (trendMap[day] || 0) + 1;
    }

    // Fill all 30 days
    const trend = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      trend.push({ date: key, count: trendMap[key] || 0 });
    }

    const resolutionRate = totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalIssues,
          openIssues,
          inProgressIssues,
          resolvedIssues,
          publicIssues,
          privateIssues,
          memberCount,
          resolutionRate,
        },
        topUpvotedIssues,
        recentActivity,
        trend,
        recentReports,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Server Error' }, { status: 500 });
  }
}
