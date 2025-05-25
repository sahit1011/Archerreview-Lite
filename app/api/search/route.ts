import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Content, Topic } from '@/models';

/**
 * API endpoint for searching content and topics
 * GET /api/search?q=query&type=content|topics|all
 */

export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();
    
    // Get query parameters
    const query = request.nextUrl.searchParams.get('q');
    const type = request.nextUrl.searchParams.get('type') || 'all';
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
    
    // Validate query
    if (!query) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Search query is required' 
        },
        { status: 400 }
      );
    }
    
    // Initialize results
    let results: any = {
      content: [],
      topics: []
    };
    
    // Search content if type is 'content' or 'all'
    if (type === 'content' || type === 'all') {
      results.content = await Content.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      })
        .populate('topic')
        .limit(limit)
        .sort({ createdAt: -1 });
    }
    
    // Search topics if type is 'topics' or 'all'
    if (type === 'topics' || type === 'all') {
      results.topics = await Topic.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } },
          { subcategory: { $regex: query, $options: 'i' } }
        ]
      })
        .limit(limit)
        .sort({ importance: -1, name: 1 });
    }
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      query,
      results
    });
  } catch (error) {
    console.error('Error searching:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Search failed',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
