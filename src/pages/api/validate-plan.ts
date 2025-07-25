import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
  }

  try {
    const { plan } = req.body;
    
    if (!plan || !plan.semesters) {
      return res.status(400).json({ success: false, error: 'Invalid plan data' });
    }

    const validationResults = await validateGraduationPlan(plan);
    res.status(200).json({ success: true, data: validationResults });
    
  } catch (error) {
    console.error('Error validating graduation plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate graduation plan'
    });
  }
}

async function validateGraduationPlan(plan: any) {
  const validationResults = {
    isValid: true,
    errors: [] as string[],
    warnings: [] as string[],
    suggestions: [] as string[]
  };

  // Validate semester credit loads
  plan.semesters.forEach((semester: any) => {
    if (semester.totalCredits > 20) {
      validationResults.warnings.push(
        `${semester.semester} ${semester.year}: Heavy course load (${semester.totalCredits} credits)`
      );
    }
    
    if (semester.totalCredits < 12 && semester.courses.length > 0) {
      validationResults.warnings.push(
        `${semester.semester} ${semester.year}: Below full-time status (${semester.totalCredits} credits)`
      );
    }
  });

  // Check for prerequisite violations
  const completedCourses = new Set<string>();
  
  for (const semester of plan.semesters) {
    for (const course of semester.courses) {
      const unmetPrereqs = course.prerequisites?.filter((prereq: string) => 
        !completedCourses.has(prereq)
      ) || [];
      
      if (unmetPrereqs.length > 0) {
        validationResults.errors.push(
          `${course.course_id} in ${semester.semester} ${semester.year}: Missing prerequisites: ${unmetPrereqs.join(', ')}`
        );
        validationResults.isValid = false;
      }
      
      completedCourses.add(course.course_id);
    }
  }

  // Check total credits for graduation requirements
  const totalCredits = plan.semesters.reduce((total: number, sem: any) => 
    total + sem.totalCredits, 0
  );
  
  if (totalCredits < 120) {
    validationResults.errors.push(
      `Insufficient total credits for graduation: ${totalCredits}/120`
    );
    validationResults.isValid = false;
  }

  if (plan.semesters.length > 8) {
    validationResults.suggestions.push('Consider taking summer courses to reduce time to graduation');
  }

  return validationResults;
}