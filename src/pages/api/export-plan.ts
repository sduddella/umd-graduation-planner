import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
  }

  try {
    const { graduationPlan, format = 'csv', includeDetails = true } = req.body;
    
    if (!graduationPlan) {
      return res.status(400).json({ success: false, error: 'Graduation plan is required' });
    }

    let exportData: string;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'csv':
        exportData = generateCSV(graduationPlan, includeDetails);
        contentType = 'text/csv';
        filename = 'graduation-plan.csv';
        break;
        
      case 'json':
        exportData = JSON.stringify(graduationPlan, null, 2);
        contentType = 'application/json';
        filename = 'graduation-plan.json';
        break;
        
      default:
        return res.status(400).json({ success: false, error: 'Unsupported format' });
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(exportData);
    
  } catch (error) {
    console.error('Error exporting graduation plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export graduation plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function generateCSV(graduationPlan: any, includeDetails: boolean): string {
  const rows = [];
  
  const headers = ['Semester', 'Year', 'Course Code', 'Course Name', 'Credits'];
  if (includeDetails) {
    headers.push('Prerequisites', 'Satisfies Requirements');
  }
  rows.push(headers.join(','));
  
  rows.push('');
  rows.push(`# Graduation Plan Summary`);
  rows.push(`# Total Credits: ${graduationPlan.totalCredits}`);
  rows.push(`# Completion Date: ${graduationPlan.completionDate}`);
  
  if (graduationPlan.majors && graduationPlan.majors.length > 0) {
    rows.push(`# Majors: ${graduationPlan.majors.map((m: any) => m.name).join(', ')}`);
  }
  
  if (graduationPlan.minors && graduationPlan.minors.length > 0) {
    rows.push(`# Minors: ${graduationPlan.minors.map((m: any) => m.name).join(', ')}`);
  }
  
  rows.push('');
  rows.push(headers.join(','));
  
  graduationPlan.semesters.forEach((semester: any) => {
    semester.courses.forEach((course: any) => {
      const row = [
        escapeCSV(semester.semester),
        semester.year.toString(),
        escapeCSV(course.course_id),
        escapeCSV(course.name),
        course.credits.toString()
      ];
      
      if (includeDetails) {
        row.push(escapeCSV(course.prerequisites?.join('; ') || ''));
        row.push(escapeCSV(course.satisfies?.join('; ') || ''));
      }
      
      rows.push(row.join(','));
    });
    
    rows.push(`# ${semester.semester} ${semester.year} Total Credits:,${semester.totalCredits}`);
    rows.push('');
  });
  
  return rows.join('\n');
}

function escapeCSV(value: string): string {
  if (!value) return '';
  
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  
  return value;
}