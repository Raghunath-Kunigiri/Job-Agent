// Vercel serverless function for job application automation
import { chromium } from 'playwright';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    console.log(`❌ Method not allowed: ${req.method}`);
    return res.status(405).json({ 
      success: false,
      error: 'Method not allowed',
      message: 'Only POST method is supported'
    });
  }

  // Log full request body for debugging
  console.log('📥 Request received:', {
    method: req.method,
    headers: req.headers,
    body: req.body,
    timestamp: new Date().toISOString()
  });

  // Extract and validate parameters
  const { 
    url, 
    jobTitle = 'Software Engineer', 
    company = 'Tech Company', 
    useAI = false 
  } = req.body || {};

  // Validate required URL parameter
  if (!url) {
    console.log('❌ Validation failed: URL is required');
    return res.status(400).json({ 
      success: false,
      error: 'URL is required',
      message: 'Please provide a valid job URL'
    });
  }

  // Sanitize company name
  const sanitizedCompany = sanitizeCompany(company);
  
  console.log('✅ Processing job application:', {
    url,
    jobTitle,
    originalCompany: company,
    sanitizedCompany,
    useAI
  });

  try {
    if (useAI) {
      console.log('🤖 Starting automated job application...');
      const message = await autoApplyToJob(url, jobTitle, sanitizedCompany);
      
      return res.status(200).json({
        success: true,
        message,
        jobTitle,
        company: sanitizedCompany,
        url,
        timestamp: new Date().toISOString()
      });
    } else {
      // If not using automation, generate cover letter
      const coverLetter = await generateCoverLetter(jobTitle, sanitizedCompany);
      
      return res.status(200).json({
        success: true,
        coverLetter,
        jobTitle,
        company: sanitizedCompany,
        url,
        message: 'Cover letter generated (no automation)',
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('❌ Unexpected error in apply function:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Return error response for automation failures
    return res.status(500).json({
      success: false,
      error: 'Automation failed',
      message: error.message,
      jobTitle,
      company: sanitizedCompany,
      url,
      timestamp: new Date().toISOString()
    });
  }
}

// Function to automate job application using Playwright
async function autoApplyToJob(url, jobTitle, company) {
  console.log('🚀 Launching browser for job automation...');
  
  let browser;
  let page;
  
  try {
    // Launch browser (headless for Vercel)
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // Vercel compatibility
    });
    
    page = await browser.newPage();
    
    // Set user agent to avoid bot detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    console.log(`🌐 Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    
    console.log('📝 Filling out application form...');
    
    // Fill out common form fields (with error handling for missing fields)
    try {
      await page.fill('input[name="firstName"]', 'Raghunath', { timeout: 3000 });
      console.log('✅ Filled first name');
    } catch (e) {
      console.log('⚠️ First name field not found');
    }
    
    try {
      await page.fill('input[name="lastName"]', 'Kunigiri', { timeout: 3000 });
      console.log('✅ Filled last name');
    } catch (e) {
      console.log('⚠️ Last name field not found');
    }
    
    try {
      await page.fill('input[name="email"]', 'kunigiriraghun@example.com', { timeout: 3000 });
      console.log('✅ Filled email');
    } catch (e) {
      console.log('⚠️ Email field not found');
    }
    
    try {
      await page.fill('input[name="phone"]', '+1-555-123-4567', { timeout: 3000 });
      console.log('✅ Filled phone');
    } catch (e) {
      console.log('⚠️ Phone field not found');
    }
    
    // Try to upload resume (simulate file upload)
    try {
      const fileInput = await page.$('input[type="file"]');
      if (fileInput) {
        // Note: In real deployment, you'd need to have a resume file accessible
        console.log('📎 Resume upload field found (skipping upload in demo)');
        // await page.setInputFiles('input[type="file"]', 'resume.pdf');
      }
    } catch (e) {
      console.log('⚠️ File upload field not found');
    }
    
    // Try to find and fill cover letter field
    try {
      const coverLetterField = await page.$('textarea[name*="cover"], textarea[name*="letter"], textarea[name*="message"]');
      if (coverLetterField) {
        const coverLetter = `I am excited to apply for the ${jobTitle} position at ${company}. My skills and experience make me a strong candidate for this role.`;
        await page.fill('textarea[name*="cover"], textarea[name*="letter"], textarea[name*="message"]', coverLetter, { timeout: 3000 });
        console.log('✅ Filled cover letter');
      }
    } catch (e) {
      console.log('⚠️ Cover letter field not found');
    }
    
    // Wait a moment before submitting
    await page.waitForTimeout(2000);
    
    // Try to submit the form (be careful - this will actually submit!)
    try {
      const submitButton = await page.$('button[type="submit"], input[type="submit"], button:has-text("Submit"), button:has-text("Apply")');
      if (submitButton) {
        console.log('🎯 Submit button found - clicking...');
        // await submitButton.click(); // Uncomment this to actually submit
        console.log('⚠️ DEMO MODE: Not actually clicking submit button');
      } else {
        console.log('⚠️ Submit button not found');
      }
    } catch (e) {
      console.log('⚠️ Could not submit form:', e.message);
    }
    
    // Wait for any confirmation or response
    await page.waitForTimeout(3000);
    
    // Check for success messages
    try {
      const successMessage = await page.$('text=success, text=submitted, text=received, text=thank');
      if (successMessage) {
        console.log('✅ Success message detected');
        return 'Job application submitted successfully!';
      }
    } catch (e) {
      console.log('⚠️ No success message found');
    }
    
    console.log('✅ Job application process completed');
    return 'Job application form filled and processed (demo mode)';
    
  } catch (error) {
    console.error('❌ Playwright Error:', error.message);
    throw new Error(`Browser automation failed: ${error.message}`);
  } finally {
    // Always close browser to free resources
    if (page) await page.close();
    if (browser) await browser.close();
    console.log('🔒 Browser closed');
  }
}

// Function to sanitize company name
function sanitizeCompany(company) {
  if (!company || typeof company !== 'string') {
    return 'the company';
  }
  
  // Remove Markdown link syntax: **[Company Name](url)**
  let sanitized = company
    .replace(/\*\*\[([^\]]+)\]\([^)]+\)\*\*/g, '$1')  // **[text](url)**
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')          // [text](url)
    .replace(/\*\*/g, '')                             // **bold**
    .replace(/\[|\]/g, '')                            // remaining [ ]
    .replace(/\([^)]*\)/g, '')                        // remaining ( )
    .trim();
    
  console.log(`🧹 Sanitized company: "${company}" → "${sanitized}"`);
  return sanitized || 'the company';
}

// Function to generate cover letter with robust error handling
async function generateCoverLetter(jobTitle, company) {
  const prompt = `Write a professional 2-sentence cover letter for applying to the ${jobTitle} role at ${company}. Make it engaging and highlight relevant skills.`;
  
  try {
    console.log('🔗 Making Gemini API request...');
    
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

    console.log(`📡 Gemini API response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(`Gemini API HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('📄 Gemini API response data:', data);
    
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (generatedText && generatedText.trim()) {
      console.log('✅ AI cover letter generated successfully');
      return generatedText.trim();
    } else {
      console.log('⚠️ Empty response from Gemini API, using fallback');
      throw new Error('Empty response from Gemini API');
    }
    
  } catch (error) {
    console.error('❌ Gemini API error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Return fallback cover letter
    const fallback = `I am excited to apply for the ${jobTitle} position at ${company}. My skills and experience make me a strong candidate for this role.`;
    console.log('🔄 Using fallback cover letter:', fallback);
    return fallback;
  }
}
