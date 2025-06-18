// Vercel serverless function for job application
import { chromium } from 'playwright-core';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method allowed' });
  }

  const { url, jobTitle = 'Software Engineer', company = 'Tech Company', useAI = false } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    console.log('Starting job application process for:', url);
    
    // Note: Playwright may have limitations on Vercel
    // This is a simplified version for demonstration
    
    if (useAI) {
      const coverLetter = await generateCoverLetter(jobTitle, company);
      return res.status(200).json({ 
        success: true, 
        message: 'AI cover letter generated successfully',
        coverLetter,
        note: 'Browser automation is limited on Vercel serverless functions'
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Job application endpoint is working',
      data: { url, jobTitle, company },
      note: 'For full browser automation, use a server with persistent processes'
    });

  } catch (error) {
    console.error('Error in apply function:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

async function generateCoverLetter(jobTitle, company) {
  const prompt = `Write a professional 2-sentence cover letter for applying to the ${jobTitle} role at ${company}.`;
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 
           `I am excited to apply for the ${jobTitle} position at ${company}. My skills and experience make me a strong candidate for this role.`;
  } catch (error) {
    console.error('Gemini API error:', error);
    return `I am excited to apply for the ${jobTitle} position at ${company}. My skills and experience make me a strong candidate for this role.`;
  }
}
