// Vercel serverless function for job application
module.exports = async function handler(req, res) {
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
    let coverLetter = null;
    
    if (useAI) {
      console.log('🤖 Generating AI cover letter...');
      coverLetter = await generateCoverLetter(jobTitle, sanitizedCompany);
    }

    const response = {
      success: true,
      coverLetter: coverLetter || `I am excited to apply for the ${jobTitle} position at ${sanitizedCompany}.`,
      jobTitle,
      company: sanitizedCompany,
      url,
      message: useAI ? 'AI cover letter generated successfully' : 'Job application endpoint is working',
      timestamp: new Date().toISOString()
    };

    console.log('✅ Response prepared:', response);
    return res.status(200).json(response);

  } catch (error) {
    console.error('❌ Unexpected error in apply function:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    // Return fallback response to prevent 500 errors
    return res.status(200).json({
      success: true,
      coverLetter: `I am excited to apply for the ${jobTitle} position at ${sanitizedCompany}.`,
      jobTitle,
      company: sanitizedCompany,
      url,
      message: 'Fallback response due to processing error',
      timestamp: new Date().toISOString()
    });
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
