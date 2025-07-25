// pages/api/courses/[courseId].ts
import type { NextApiRequest, NextApiResponse } from 'next';

interface CourseInfo {
  course_id: string;
  name: string;
  description: string;
  credits: number;
  prerequisites: string[];
  corequisites: string[];
  restrictions: string[];
  sections?: CourseSection[];
}

interface CourseSection {
  section_id: string;
  instructor: string;
  days: string[];
  start_time: string;
  end_time: string;
  location: string;
  seats_available: number;
  seats_total: number;
}

interface UMDApiResponse {
  course_id: string;
  name: string;
  description: string;
  credits: string;
  relationships: {
    prereqs?: string;
    coreqs?: string;
    restrictions?: string;
  };
}

interface ApiResponse {
  success: boolean;
  data?: CourseInfo;
  error?: string;
  details?: string;
}

// Cache for course data to avoid repeated API calls
const courseCache = new Map<string, { data: CourseInfo; timestamp: number }>();
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} not allowed` 
    });
  }

  const { courseId } = req.query;
  
  if (!courseId || typeof courseId !== 'string') {
    return res.status(400).json({ 
      success: false, 
      error: 'Course ID is required' 
    });
  }

  try {
    // Check cache first
    const cached = courseCache.get(courseId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return res.status(200).json({ success: true, data: cached.data });
    }

    // Fetch from UMD API
    const courseInfo = await fetchCourseFromUMDAPI(courseId);
    
    // Cache the result
    courseCache.set(courseId, { data: courseInfo, timestamp: Date.now() });
    
    // Clean up old cache entries
    cleanupCache();

    res.status(200).json({ success: true, data: courseInfo });
    
  } catch (error) {
    console.error('Error fetching course information:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch course information',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function fetchCourseFromUMDAPI(courseId: string): Promise<CourseInfo> {
  try {
    // Fetch basic course information
    const apiUrl = `https://beta.umd.io/v1/courses/${courseId}`;
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`UMD API request failed: ${response.status}`);
    }

    const apiData: UMDApiResponse[] = await response.json();
    
    if (!Array.isArray(apiData) || apiData.length === 0) {
      throw new Error('Course not found');
    }

    const courseData = apiData[0];
    
    // Parse prerequisites and corequisites
    const prerequisites = parsePrerequisites(courseData.relationships.prereqs || '');
    const corequisites = parseCorequisites(courseData.relationships.coreqs || '');
    const restrictions = parseRestrictions(courseData.relationships.restrictions || '');

    // Try to fetch sections information
    let sections: CourseSection[] = [];
    try {
      sections = await fetchCourseSections(courseId);
    } catch (sectionError) {
      console.warn(`Could not fetch sections for ${courseId}:`, sectionError);
    }

    const courseInfo: CourseInfo = {
      course_id: courseData.course_id,
      name: courseData.name,
      description: courseData.description,
      credits: parseInt(courseData.credits) || 0,
      prerequisites,
      corequisites,
      restrictions,
      sections
    };

    return courseInfo;
    
  } catch (error) {
    // If UMD API fails, return basic course info
    console.warn(`UMD API failed for ${courseId}, returning basic info:`, error);
    
    return {
      course_id: courseId,
      name: courseId, // Fallback to course ID as name
      description: 'Course information not available',
      credits: 3, // Default assumption
      prerequisites: [],
      corequisites: [],
      restrictions: [],
      sections: []
    };
  }
}

async function fetchCourseSections(courseId: string): Promise<CourseSection[]> {
  try {
    // This would fetch current semester sections
    const sectionsUrl = `https://beta.umd.io/v1/courses/sections?course_id=${courseId}`;
    const response = await fetch(sectionsUrl);
    
    if (!response.ok) {
      return []; // Return empty array if sections not found
    }

    const sectionsData = await response.json();
    
    if (!Array.isArray(sectionsData)) {
      return [];
    }

    return sectionsData.map((section: any) => ({
      section_id: section.section_id || '',
      instructor: section.instructors?.join(', ') || 'TBA',
      days: section.meetings?.[0]?.days || [],
      start_time: section.meetings?.[0]?.start_time || '',
      end_time: section.meetings?.[0]?.end_time || '',
      location: section.meetings?.[0]?.building || '',
      seats_available: parseInt(section.seats_available) || 0,
      seats_total: parseInt(section.seats_total) || 0
    }));
    
  } catch (error) {
    console.warn(`Error fetching sections for ${courseId}:`, error);
    return [];
  }
}

// Helper functions to parse prerequisite strings
function parsePrerequisites(prereqString: string): string[] {
  if (!prereqString) return [];
  
  // Extract course codes from prerequisite string
  const courseMatches = prereqString.match(/[A-Z]{4}\s*\d{3}[A-Z]?/g);
  return courseMatches ? courseMatches.map(course => course.replace(/\s+/g, '')) : [];
}

function parseCorequisites(coreqString: string): string[] {
  if (!coreqString) return [];
  
  const courseMatches = coreqString.match(/[A-Z]{4}\s*\d{3}[A-Z]?/g);
  return courseMatches ? courseMatches.map(course => course.replace(/\s+/g, '')) : [];
}

function parseRestrictions(restrictionString: string): string[] {
  if (!restrictionString) return [];
  
  // Parse restrictions into an array of restriction descriptions
  return restrictionString.split(',').map(r => r.trim()).filter(r => r.length > 0);
}

function cleanupCache() {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  courseCache.forEach((value, key) => {
    if (now - value.timestamp > CACHE_DURATION) {
      keysToDelete.push(key);
    }
  });
  
  keysToDelete.forEach(key => courseCache.delete(key));
}