// pages/api/scrape-majors.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import * as cheerio from 'cheerio';

interface MajorRequirement {
  category: string;
  credits: number;
  courses: string[];
  description: string;
  prerequisites?: string[];
}

interface MajorData {
  name: string;
  code: string;
  totalCredits: number;
  requirements: MajorRequirement[];
  corequisites: string[];
  restrictions: string[];
}

interface ApiResponse {
  success: boolean;
  data?: MajorData | MajorData[];
  error?: string;
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method === 'GET') {
    const { major } = req.query;
    
    if (!major || typeof major !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Major code is required' 
      });
    }

    try {
      const majorData = await scrapeMajorRequirements(major);
      res.status(200).json({ success: true, data: majorData });
    } catch (error) {
      console.error('Error scraping major requirements:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to scrape major requirements',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  } else if (req.method === 'POST') {
    const { majors } = req.body;
    
    if (!Array.isArray(majors)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Majors must be an array' 
      });
    }

    try {
      const results = await Promise.all(
        majors.map(async (majorCode: string) => {
          try {
            const data = await scrapeMajorRequirements(majorCode);
            return { majorCode, success: true, data, error: null };
          } catch (error) {
            return { 
              majorCode, 
              success: false, 
              data: null, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            };
          }
        })
      );

      res.status(200).json({ success: true, data: results });
    } catch (error) {
      console.error('Error in batch scraping:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process batch scraping request'
      });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).json({ 
      success: false, 
      error: `Method ${req.method} not allowed` 
    });
  }
}

async function scrapeMajorRequirements(majorCode: string): Promise<MajorData> {
  // Try multiple URL patterns for different colleges
  const possibleUrls = [
    `https://academiccatalog.umd.edu/undergraduate/colleges-schools/computer-mathematical-natural-sciences/computer-science/${majorCode.toLowerCase()}/`,
    `https://academiccatalog.umd.edu/undergraduate/colleges-schools/engineering/${majorCode.toLowerCase()}/`,
    `https://academiccatalog.umd.edu/undergraduate/colleges-schools/business/${majorCode.toLowerCase()}/`,
    `https://academiccatalog.umd.edu/undergraduate/colleges-schools/arts-humanities/${majorCode.toLowerCase()}/`,
    `https://academiccatalog.umd.edu/undergraduate/colleges-schools/behavioral-social-sciences/${majorCode.toLowerCase()}/`,
    `https://academiccatalog.umd.edu/undergraduate/colleges-schools/education/${majorCode.toLowerCase()}/`,
    `https://academiccatalog.umd.edu/undergraduate/colleges-schools/journalism/${majorCode.toLowerCase()}/`,
    `https://academiccatalog.umd.edu/undergraduate/colleges-schools/public-health/${majorCode.toLowerCase()}/`,
    `https://academiccatalog.umd.edu/undergraduate/colleges-schools/agriculture-natural-resources/${majorCode.toLowerCase()}/`
  ];

  let html = '';
  let successUrl = '';

  // Try each URL until we find one that works
  for (const url of possibleUrls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        html = await response.text();
        successUrl = url;
        break;
      }
    } catch (error) {
      continue;
    }
  }

  if (!html) {
    throw new Error(`Failed to find catalog page for major: ${majorCode}`);
  }

  const $ = cheerio.load(html);
  
  const majorData: MajorData = {
    name: '',
    code: majorCode.toUpperCase(),
    totalCredits: 0,
    requirements: [],
    corequisites: [],
    restrictions: []
  };

  // Extract major name
  majorData.name = $('.page-title').text().trim() || $('h1').first().text().trim();

  // Extract total credits
  const creditsMatch = $('body').text().match(/(\d+)\s*credits?/i);
  if (creditsMatch) {
    majorData.totalCredits = parseInt(creditsMatch[1]);
  }

  // Extract requirements sections
  $('.requirement-block, .sc_courselist, .courseblock').each((i, element) => {
    const $element = $(element);
    const category = $element.find('.requirement-title, h3, h4, strong').first().text().trim();
    
    if (!category) return;

    const requirement: MajorRequirement = {
      category,
      credits: 0,
      courses: [],
      description: '',
      prerequisites: []
    };

    // Extract credit information
    const creditMatch = $element.text().match(/(\d+)\s*credits?/i);
    if (creditMatch) {
      requirement.credits = parseInt(creditMatch[1]);
    }

    // Extract course codes
    const courseMatches = $element.text().match(/[A-Z]{4}\s*\d{3}[A-Z]?/g);
    if (courseMatches) {
      requirement.courses = courseMatches.map(course => course.replace(/\s+/g, ''));
    }

    // Extract description
    requirement.description = $element.find('.courseblockdesc, .requirement-desc, p').first().text().trim();

    if (requirement.courses.length > 0 || requirement.description.length > 10) {
      majorData.requirements.push(requirement);
    }
  });

  // Extract corequisites and prerequisites from course descriptions
  $('.courseblock').each((i, element) => {
    const $element = $(element);
    const prereqText = $element.find('.courseblockdesc').text();
    
    const prereqMatch = prereqText.match(/Prerequisite:\s*([^.]+)/i);
    if (prereqMatch) {
      const courses = prereqMatch[1].match(/[A-Z]{4}\s*\d{3}[A-Z]?/g);
      if (courses) {
        majorData.corequisites.push(...courses.map(c => c.replace(/\s+/g, '')));
      }
    }
  });

  // Extract restrictions
  const restrictionText = $('body').text();
  const restrictionPatterns = [
    /minimum grade of [A-Z-]/i,
    /cannot be used to satisfy/i,
    /not available to.*majors/i,
    /prerequisite.*required/i
  ];

  restrictionPatterns.forEach(pattern => {
    const match = restrictionText.match(new RegExp(`[^.]*${pattern.source}[^.]*`, 'i'));
    if (match) {
      majorData.restrictions.push(match[0].trim());
    }
  });

  return majorData;
}