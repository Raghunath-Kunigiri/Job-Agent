import { chromium } from 'playwright';
import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' });
  }

  const { url, jobTitle, company, resumeUrl, useAI = false } = req.body;

  try {
    // 1. Launch browser
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });

    // 2. Simulate form filling (modify selectors as needed)
    await page.fill('input[name="firstName"]', 'Raghunath');
    await page.fill('input[name="lastName"]', 'Kunigiri');
    await page.fill('input[name="email"]', 'kunigiriraghun@example.com');
    await page.fill('input[name="location"]', 'St. Louis, MO');

    // Upload resume (assumes local upload form)
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.click('input[type="file"]'),
    ]);
    await fileChooser.setFiles('./RAGHUNATH_KUNIGIRI.pdf'); // Replace with uploaded file path

    // 3. Use Gemini to answer questions
    if (useAI) {
      const answer = await generateAnswerWithGemini(jobTitle, company);
      await page.fill('textarea[name="coverLetter"]', answer);
    }

    // 4. Submit the application
    await page.click('button[type="submit"]');

    await browser.close();
    res.status(200).json({ success: true, status: 'submitted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

async function generateAnswerWithGemini(jobTitle, company) {
  const prompt = `Write a 2-sentence reason for applying to the ${jobTitle} role at ${company}.`;

  const result = await axios.post(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=213727560057',
    { contents: [{ parts: [{ text: prompt }] }] }
  );

  return result.data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
