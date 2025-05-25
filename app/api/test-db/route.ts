import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { User, Topic, StudyPlan, Content } from '@/models';

export async function GET() {
  try {
    // Connect to the database
    await dbConnect();

    // Count documents in collections
    const userCount = await User.countDocuments();
    const topicCount = await Topic.countDocuments();
    const planCount = await StudyPlan.countDocuments();
    const contentCount = await Content.countDocuments();

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      counts: {
        users: userCount,
        topics: topicCount,
        plans: planCount,
        content: contentCount
      }
    });
  } catch (error) {
    console.error('Database connection error:', error);

    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
