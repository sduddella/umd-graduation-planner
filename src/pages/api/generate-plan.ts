// pages/api/generate-plan.ts
import type { NextApiRequest, NextApiResponse } from 'next';

interface CompletedCourse {
  course_id: string;
  credits: number;
  grade?: string;
  semester?: string;
  source?: 'highschool' | 'college' | 'ap' | 'transfer';
}

interface Major {
  code: string;
  name: string;
  requirements: any[];
}

interface Minor {
  code: string;
  name: string;
  requirements: any[];
}

interface GeneratePlanRequest {
  majors: Major[];
  minors?: Minor[];
  completedCourses: CompletedCourse[];
  startingSemester: string; // e.g., "Fall 2024"
  graduationTarget: string; // e.g., "Spring 2028"
  maxCreditsPerSemester: number;
  preferredCourseLoad: 'light' | 'normal' | 'heavy';
}

interface PlannedCourse {
  course_id: string;
  name: string;
  credits: number;
  prerequisites: string[];
  satisfies: string[]; // Which requirements this course satisfies
}

interface SemesterPlan {
  semester: string;
  year: number;
  courses: PlannedCourse[];
  totalCredits: number;
}

interface GraduationPlan {
  student_id?: string;
  majors: Major[];
  minors: Minor[];
  semesters: SemesterPlan[];
  totalCredits: number;
  completionDate: string;
  warnings: string[];
  unmetRequirements: string[];
}

interface ApiResponse {
  success: boolean;
  data?: GraduationPlan;
  error?: string;
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} not allowed` 
    });
  }

  try {
    const requestData: GeneratePlanRequest = req.body;
    
    // Validate input
    if (!requestData.majors || requestData.majors.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'At least one major is required' 
      });
    }

    // Generate the graduation plan
    const graduationPlan = await generateGraduationPlan(requestData);
    
    res.status(200).json({ 
      success: true, 
      data: graduationPlan 
    });
    
  } catch (error) {
    console.error('Error generating graduation plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate graduation plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function generateGraduationPlan(request: GeneratePlanRequest): Promise<GraduationPlan> {
  const { majors, minors = [], completedCourses, startingSemester, graduationTarget, maxCreditsPerSemester } = request;
  
  // Parse semester information
  const startSemester = parseSemester(startingSemester);
  const targetSemester = parseSemester(graduationTarget);
  
  // Calculate available semesters
  const availableSemesters = generateSemesterSequence(startSemester, targetSemester);
  
  // Collect all requirements
  const allRequirements = [
    ...majors.flatMap(major => major.requirements),
    ...minors.flatMap(minor => minor.requirements)
  ];
  
  // Determine which requirements are already satisfied
  const satisfiedRequirements = checkSatisfiedRequirements(allRequirements, completedCourses);
  const remainingRequirements = allRequirements.filter(req => !satisfiedRequirements.includes(req.category));
  
  // Fetch course information for all required courses
  const allRequiredCourses = new Set<string>();
  remainingRequirements.forEach(req => {
    req.courses?.forEach((course: string) => allRequiredCourses.add(course));
  });
  
  const courseInfo = await fetchCourseInformation(Array.from(allRequiredCourses));
  
  // Generate course sequence respecting prerequisites
  const courseSequence = await planCourseSequence(
    remainingRequirements,
    courseInfo,
    completedCourses.map(c => c.course_id),
    availableSemesters,
    maxCreditsPerSemester
  );
  
  // Build semester plans
  const semesters: SemesterPlan[] = availableSemesters.map(sem => ({
    semester: sem.season,
    year: sem.year,
    courses: courseSequence.filter(course => 
      course.plannedSemester === `${sem.season} ${sem.year}`
    ).map(course => ({
      course_id: course.course_id,
      name: course.name,
      credits: course.credits,
      prerequisites: course.prerequisites,
      satisfies: course.satisfies
    })),
    totalCredits: 0
  }));
  
  // Calculate total credits for each semester
  semesters.forEach(sem => {
    sem.totalCredits = sem.courses.reduce((total, course) => total + course.credits, 0);
  });
  
  // Check for warnings and unmet requirements
  const warnings = generateWarnings(semesters, maxCreditsPerSemester);
  const unmetRequirements = findUnmetRequirements(allRequirements, courseSequence);
  
  const totalCredits = semesters.reduce((total, sem) => total + sem.totalCredits, 0) +
    completedCourses.reduce((total, course) => total + course.credits, 0);
  
  return {
    majors,
    minors,
    semesters: semesters.filter(sem => sem.courses.length > 0),
    totalCredits,
    completionDate: graduationTarget,
    warnings,
    unmetRequirements
  };
}

function parseSemester(semesterString: string): { season: string; year: number } {
  const [season, yearStr] = semesterString.split(' ');
  return { season: season.toLowerCase(), year: parseInt(yearStr) };
}

function generateSemesterSequence(start: { season: string; year: number }, end: { season: string; year: number }) {
  const semesters = [];
  const seasons = ['spring', 'summer', 'fall'];
  
  let currentYear = start.year;
  let currentSeasonIndex = seasons.indexOf(start.season);
  
  while (currentYear < end.year || (currentYear === end.year && currentSeasonIndex <= seasons.indexOf(end.season))) {
    semesters.push({ season: seasons[currentSeasonIndex], year: currentYear });
    
    currentSeasonIndex++;
    if (currentSeasonIndex >= seasons.length) {
      currentSeasonIndex = 0;
      currentYear++;
    }
  }
  
  return semesters;
}

function checkSatisfiedRequirements(requirements: any[], completedCourses: CompletedCourse[]): string[] {
  const completedCourseIds = new Set(completedCourses.map(c => c.course_id));
  const satisfied = [];
  
  for (const req of requirements) {
    const requiredCourses = req.courses || [];
    const hasAllRequired = requiredCourses.every((course: string) => completedCourseIds.has(course));
    
    if (hasAllRequired && requiredCourses.length > 0) {
      satisfied.push(req.category);
    }
  }
  
  return satisfied;
}

async function fetchCourseInformation(courseIds: string[]) {
  const courseInfo: any = {};
  
  // Fetch course information from UMD API or our courses API
  for (const courseId of courseIds) {
    try {
      const response = await fetch(`https://beta.umd.io/v1/courses/${courseId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          const course = data[0];
          courseInfo[courseId] = {
            course_id: courseId,
            name: course.name || courseId,
            credits: parseInt(course.credits) || 3,
            prerequisites: parsePrerequisites(course.relationships?.prereqs || ''),
            description: course.description || ''
          };
        }
      }
    } catch (error) {
      // Fallback for courses we can't fetch
      courseInfo[courseId] = {
        course_id: courseId,
        name: courseId,
        credits: 3, // Default assumption
        prerequisites: [],
        description: ''
      };
    }
  }
  
  return courseInfo;
}

function parsePrerequisites(prereqString: string): string[] {
  if (!prereqString) return [];
  
  // Extract course codes from prerequisite string
  const courseMatches = prereqString.match(/[A-Z]{4}\s*\d{3}[A-Z]?/g);
  return courseMatches ? courseMatches.map(course => course.replace(/\s+/g, '')) : [];
}

async function planCourseSequence(
  requirements: any[],
  courseInfo: any,
  completedCourses: string[],
  availableSemesters: any[],
  maxCreditsPerSemester: number
) {
  const plannedCourses = [];
  const completed = new Set(completedCourses);
  
  // Simple greedy algorithm for course scheduling
  for (const semester of availableSemesters) {
    const semesterKey = `${semester.season} ${semester.year}`;
    let currentCredits = 0;
    
    for (const req of requirements) {
      if (!req.courses) continue;
      
      for (const courseId of req.courses) {
        if (completed.has(courseId)) continue;
        if (currentCredits >= maxCreditsPerSemester) break;
        
        const course = courseInfo[courseId];
        if (!course) continue;
        
        // Check if prerequisites are satisfied
        const prereqsSatisfied = course.prerequisites.every((prereq: string) => completed.has(prereq));
        
        if (prereqsSatisfied) {
          plannedCourses.push({
            course_id: courseId,
            name: course.name,
            credits: course.credits,
            prerequisites: course.prerequisites,
            satisfies: [req.category],
            plannedSemester: semesterKey
          });
          
          completed.add(courseId);
          currentCredits += course.credits;
        }
      }
    }
  }
  
  return plannedCourses;
}

function generateWarnings(semesters: SemesterPlan[], maxCreditsPerSemester: number): string[] {
  const warnings = [];
  
  semesters.forEach(sem => {
    if (sem.totalCredits > maxCreditsPerSemester) {
      warnings.push(`${sem.semester} ${sem.year}: Overloaded with ${sem.totalCredits} credits`);
    }
    if (sem.totalCredits < 12 && sem.courses.length > 0) {
      warnings.push(`${sem.semester} ${sem.year}: Under full-time status with ${sem.totalCredits} credits`);
    }
  });
  
  return warnings;
}

function findUnmetRequirements(allRequirements: any[], plannedCourses: any[]): string[] {
  const plannedCourseIds = new Set(plannedCourses.map(c => c.course_id));
  const unmet = [];
  
  for (const req of allRequirements) {
    if (!req.courses) continue;
    
    const hasRequiredCourse = req.courses.some((course: string) => plannedCourseIds.has(course));
    if (!hasRequiredCourse) {
      unmet.push(req.category);
    }
  }
  
  return unmet;
}