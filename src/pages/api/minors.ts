import type { NextApiRequest, NextApiResponse } from 'next';
import * as cheerio from 'cheerio';

interface MinorRequirement {
  category: string;
  credits: number;
  courses: string[];
  description: string;
  electives?: boolean;
}

interface MinorData {
  name: string;
  code: string;
  totalCredits: number;
  requirements: MinorRequirement[];
  restrictions: string[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const { minor, list } = req.query;
    
    if (list === 'true') {
      const availableMinors = await getAvailableMinors();
      return res.status(200).json({ success: true, data: availableMinors });
    }
    
    if (!minor || typeof minor !== 'string') {
      return res.status(400).json({ success: false, error: 'Minor code required' });
    }

    try {
      const minorData = await scrapeMinorRequirements(minor);
      res.status(200).json({ success: true, data: minorData });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch minor requirements',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (req.method === 'POST') {
    const { minors } = req.body;
    
    if (!Array.isArray(minors)) {
      return res.status(400).json({ success: false, error: 'Minors must be an array' });
    }

    try {
      const results = await Promise.all(
        minors.map(async (minorCode: string) => {
          try {
            const data = await scrapeMinorRequirements(minorCode);
            return { minorCode, success: true, data, error: null };
          } catch (error) {
            return { 
              minorCode, 
              success: false, 
              data: null, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            };
          }
        })
      );

      res.status(200).json({ success: true, results });
    } catch (error) {
      res.status(500).json({ success: false, error: 'Failed to process batch request' });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
  }
}

async function scrapeMinorRequirements(minorCode: string): Promise<MinorData> {
  const possibleUrls = [
    `https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/${minorCode.toLowerCase()}-minor/`,
    `https://academiccatalog.umd.edu/undergraduate/colleges-schools/arts-humanities/${minorCode.toLowerCase()}-minor/`,
    `https://academiccatalog.umd.edu/undergraduate/colleges-schools/behavioral-social-sciences/${minorCode.toLowerCase()}-minor/`,
    `https://academiccatalog.umd.edu/undergraduate/colleges-schools/business/${minorCode.toLowerCase()}-minor/`,
    `https://academiccatalog.umd.edu/undergraduate/colleges-schools/education/${minorCode.toLowerCase()}-minor/`,
    `https://academiccatalog.umd.edu/undergraduate/colleges-schools/engineering/${minorCode.toLowerCase()}-minor/`,
    `https://academiccatalog.umd.edu/undergraduate/colleges-schools/journalism/${minorCode.toLowerCase()}-minor/`,
    `https://academiccatalog.umd.edu/undergraduate/colleges-schools/public-health/${minorCode.toLowerCase()}-minor/`,
    `https://academiccatalog.umd.edu/undergraduate/colleges-schools/agriculture-natural-resources/${minorCode.toLowerCase()}-minor/`
  ];

  let html = '';
  for (const url of possibleUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        html = await response.text();
        break;
      }
    } catch (error) {
      continue;
    }
  }

  if (!html) {
    throw new Error(`Failed to find catalog page for minor: ${minorCode}`);
  }

  const $ = cheerio.load(html);
  
  const minorData: MinorData = {
    name: $('.page-title').text().trim().replace(/\s+Minor\s*$/i, '').trim() || minorCode,
    code: minorCode.toUpperCase(),
    totalCredits: 0,
    requirements: [],
    restrictions: []
  };

  const creditsMatch = $('body').text().match(/(\d+)\s*credits?\s*(?:are\s+)?required/i);
  if (creditsMatch) {
    minorData.totalCredits = parseInt(creditsMatch[1]);
  }

  $('.requirement-block, .sc_courselist, .courseblock').each((i, element) => {
    const $element = $(element);
    const sectionText = $element.text();
    
    if (sectionText.length < 10) return;
    
    const requirement: MinorRequirement = {
      category: $element.find('h3, h4, .requirement-title, strong').first().text().trim() || 'Core Requirements',
      credits: 0,
      courses: [],
      description: '',
      electives: false
    };

    const creditMatch = sectionText.match(/(\d+)\s*credits?/i);
    if (creditMatch) {
      requirement.credits = parseInt(creditMatch[1]);
    }

    const courseMatches = sectionText.match(/[A-Z]{4}\s*\d{3}[A-Z]?/g);
    if (courseMatches) {
      requirement.courses = courseMatches.map(course => course.replace(/\s+/g, ''));
    }

    requirement.electives = /elective|choose|select|from/i.test(requirement.category);
    requirement.description = $element.find('.courseblockdesc, p').first().text().trim() || sectionText.substring(0, 200).trim();

    if (requirement.courses.length > 0 || requirement.description.length > 10) {
      minorData.requirements.push(requirement);
    }
  });

  return minorData;
}

async function getAvailableMinors() {
  return [
    { code: 'MATH', name: 'Mathematics', college: 'Computer, Mathematical & Natural Sciences' },
    { code: 'PHYS', name: 'Physics', college: 'Computer, Mathematical & Natural Sciences' },
    { code: 'CHEM', name: 'Chemistry', college: 'Computer, Mathematical & Natural Sciences' },
    { code: 'BIOL', name: 'Biology', college: 'Computer, Mathematical & Natural Sciences' },
    { code: 'PSYC', name: 'Psychology', college: 'Behavioral and Social Sciences' },
    { code: 'ECON', name: 'Economics', college: 'Behavioral and Social Sciences' },
    { code: 'CS', name: 'Computer Science', college: 'Computer, Mathematical & Natural Sciences' },
    { code: 'HIST', name: 'History', college: 'Arts and Humanities' },
    { code: 'ENGL', name: 'English', college: 'Arts and Humanities' },
    { code: 'PHIL', name: 'Philosophy', college: 'Arts and Humanities' },
    { code: 'BMGT', name: 'Business', college: 'Robert H. Smith School of Business' },
    { code: 'JOUR', name: 'Journalism', college: 'Philip Merrill College of Journalism' }
  ];
}