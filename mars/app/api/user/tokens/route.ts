import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { TokenBalance } from '@/models/TokenBalance';
import { getUserIdFromRequest } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    let balanceRecord = await TokenBalance.findOne({ user_id: userId });
    const totalUsers = await TokenBalance.countDocuments({});
    
    // Calculate global share
    const GLOBAL_DAILY_QUOTA = 1000000;
    const sharePerUser = totalUsers > 0 ? Math.floor(GLOBAL_DAILY_QUOTA / totalUsers) : 100000;

    // Calculate time until next reset (Midnight UTC)
    const now = new Date();
    const nextReset = new Date();
    nextReset.setUTCHours(24, 0, 0, 0); // Next 00:00:00 UTC
    const timeUntilReset = nextReset.getTime() - now.getTime();

    if (!balanceRecord) {
      // Initialize with current global share
      balanceRecord = await TokenBalance.create({
        user_id: userId,
        balance: sharePerUser,
        total_used: 0
      });
    }

    return NextResponse.json({
      balance: balanceRecord.balance,
      total_used: balanceRecord.total_used,
      nextReset: nextReset.getTime(),
      globalQuota: GLOBAL_DAILY_QUOTA,
      totalUsers,
      sharePerUser,
      userId
    });
  } catch (err: any) {
    console.error('Failed to fetch token balance:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
