import 'dotenv/config';
import express from 'express';
import { chromium } from 'playwright';
import axios from 'axios';
import { config } from './config.js';

const app = express();
app.use(express.json());

// Job application endpoint
app.post('/api/apply', async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { url, jobTitle, company, resumeUrl, useAI = false } = req.body;

  try {
    console.log('Starting job application process...');
    
    // 1. Launch browser
    const browser = await chromium.launch({ headless: false }); // Set to false to see what's happening
    const page = await browser.newPage();
    
    console.log(`Navigating to: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle' });

    // 2. Simulate form filling (modify selectors as needed)
    try {
      await page.fill('input[name="firstName"]', config.PERSONAL_INFO.firstName, { timeout: 5000 });
      await page.fill('input[name="lastName"]', config.PERSONAL_INFO.lastName, { timeout: 5000 });
      await page.fill('input[name="email"]', config.PERSONAL_INFO.email, { timeout: 5000 });
      await page.fill('input[name="location"]', config.PERSONAL_INFO.location, { timeout: 5000 });
    } catch (error) {
      console.log('Some form fields not found, continuing...');
    }

    // Upload resume (if file upload exists)
    try {
      const [fileChooser] = await Promise.all([
        page.waitForEvent('filechooser', { timeout: 5000 }),
        page.click('input[type="file"]'),
      ]);
      await fileChooser.setFiles(config.RESUME_PATH);
    } catch (error) {
      console.log('File upload not found or failed, continuing...');
    }

    // 3. Use Gemini to answer questions
    if (useAI) {
      try {
        const answer = await generateAnswerWithGemini(jobTitle, company);
        await page.fill('textarea[name="coverLetter"]', answer, { timeout: 5000 });
      } catch (error) {
        console.log('AI text generation failed or cover letter field not found');
      }
    }

    // 4. Submit the application (optional - be careful!)
    // await page.click('button[type="submit"]');

    console.log('Keeping browser open for 10 seconds for review...');
    await page.waitForTimeout(10000);

    await browser.close();
    res.status(200).json({ success: true, status: 'completed' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: err.message });
  }
});

async function generateAnswerWithGemini(jobTitle, company) {
  const prompt = `Write a 2-sentence reason for applying to the ${jobTitle} role at ${company}.`;

  try {
    const result = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${config.GEMINI_API_KEY}`,
      { contents: [{ parts: [{ text: prompt }] }] }
    );

    return result.data.candidates?.[0]?.content?.parts?.[0]?.text || 'I am excited about this opportunity.';
  } catch (error) {
    console.error('Gemini API error:', error);
    return 'I am excited about this opportunity and believe I would be a great fit for this role.';
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Job Applier API is running' });
});

const PORT = config.PORT;
app.listen(PORT, () => {
  console.log(`🚀 Job Applier API running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 Apply endpoint: http://localhost:${PORT}/api/apply`);
}); 