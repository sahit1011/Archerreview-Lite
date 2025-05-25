import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import { Topic } from '@/models';

/**
 * API endpoint for topic management
 * GET /api/topics - Get all topics or search by query
 * POST /api/topics - Create new topic
 */

export async function GET(request: NextRequest) {
  try {
    // Connect to the database
    await dbConnect();
    
    // Get query parameters
    const searchQuery = request.nextUrl.searchParams.get('search');
    const category = request.nextUrl.searchParams.get('category');
    const difficulty = request.nextUrl.searchParams.get('difficulty');
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '50');
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1');
    
    // Build query
    let query: any = {};
    
    // Add search query if provided
    if (searchQuery) {
      query.$or = [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ];
    }
    
    // Add category filter if provided
    if (category) {
      query.category = category;
    }
    
    // Add difficulty filter if provided
    if (difficulty) {
      query.difficulty = difficulty;
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get topics with pagination
    const topics = await Topic.find(query)
      .populate('prerequisites')
      .skip(skip)
      .limit(limit)
      .sort({ importance: -1, name: 1 });
    
    // Get total count for pagination
    const totalCount = await Topic.countDocuments(query);
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      topics,
      pagination: {
        total: totalCount,
        page,
        limit,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching topics:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to fetch topics',
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
    if (!body.name || !body.description || !body.category) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Missing required fields: name, description, category' 
        },
        { status: 400 }
      );
    }
    
    // Check for valid category
    const validCategories = [
      'MANAGEMENT_OF_CARE',
      'SAFETY_AND_INFECTION_CONTROL',
      'HEALTH_PROMOTION',
      'PSYCHOSOCIAL_INTEGRITY',
      'BASIC_CARE_AND_COMFORT',
      'PHARMACOLOGICAL_THERAPIES',
      'REDUCTION_OF_RISK_POTENTIAL',
      'PHYSIOLOGICAL_ADAPTATION'
    ];
    
    if (!validCategories.includes(body.category)) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Invalid category. Must be one of: ' + validCategories.join(', ')
        },
        { status: 400 }
      );
    }
    
    // Check if prerequisites exist
    if (body.prerequisites && body.prerequisites.length > 0) {
      const prereqCount = await Topic.countDocuments({
        _id: { $in: body.prerequisites }
      });
      
      if (prereqCount !== body.prerequisites.length) {
        return NextResponse.json(
          { 
            success: false, 
            message: 'One or more prerequisites not found' 
          },
          { status: 404 }
        );
      }
    }
    
    // Create topic object
    const topicData = {
      name: body.name,
      description: body.description,
      category: body.category,
      subcategory: body.subcategory,
      prerequisites: body.prerequisites || [],
      difficulty: body.difficulty || 'MEDIUM',
      importance: body.importance || 5,
      estimatedDuration: body.estimatedDuration || 30
    };
    
    // Create new topic
    const topic = new Topic(topicData);
    
    // Save topic to database
    await topic.save();
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'Topic created successfully',
      topic
    });
  } catch (error) {
    console.error('Error creating topic:', error);
    
    // Return error response
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to create topic',
        error: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
