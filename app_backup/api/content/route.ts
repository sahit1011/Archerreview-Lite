import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Content, Topic } from '@/models';

/**
 * API endpoint for content management
 * GET /api/content - Get all content or search by query
 * POST /api/content - Create new content
 */

export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();
    
    // Get query parameters
    const searchQuery = request.nextUrl.searchParams.get('search');
    const topicId = request.nextUrl.searchParams.get('topic');
    const type = request.nextUrl.searchParams.get('type');
    const difficulty = request.nextUrl.searchParams.get('difficulty');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '20');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    
    // Build query
    let query: any = {};
    
    // Add search query if provided
    if (searchQuery) {
      query.$or = [
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ];
    }
    
    // Add topic filter if provided
    if (topicId) {
      query.topic = topicId;
    }
    
    // Add type filter if provided
    if (type) {
      query.type = type;
    }
    
    // Add difficulty filter if provided
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get content with pagination
    const content = await Content.find(query)
      .populate('topic')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    
    // Get total count for pagination
    const totalCount = await Content.countDocuments(query);
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      content,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching content:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch content',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.title || !body.description || !body.type || !body.topicId || !body.duration) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: title, description, type, topicId, duration' 
        },
        { status: 400 }
      );
    }
    
    // Check if topic exists
    const topic = await Topic.findById(body.topicId);
    if (!topic) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Topic not found' 
        },
        { status: 404 }
      );
    }
    
    // Create content object
    const contentData = {
      title: body.title,
      description: body.description,
      type: body.type,
      topic: body.topicId,
      duration: body.duration,
      difficulty: body.difficulty || 'MEDIUM',
      url: body.url,
      content: body.content,
      questions: body.questions
    };
    
    // Create new content
    const content = new Content(contentData);
    
    // Save content to database
    await content.save();
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Content created successfully',
      content
    });
  } catch (error) {
    console.error('Error creating content:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create content',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
