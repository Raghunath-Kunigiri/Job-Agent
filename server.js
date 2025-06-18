import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 9000; // Using port 9000 to avoid conflicts

app.use(express.json());
app.use(express.static('.'));

// Hello endpoint
app.get('/api/hello', (req, res) => {
  console.log('✅ Hello endpoint accessed');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  res.json({
    message: 'Hello from Job Applier API!',
    timestamp: new Date().toISOString(),
    status: 'working',
    endpoints: {
      hello: 'GET /api/hello',
      apply: 'POST /api/apply'
    }
  });
});

// Apply endpoint with AI cover letter generation
app.post('/api/apply', async (req, res) => {
  console.log('🎯 Apply endpoint accessed with data:', req.body);
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { url, jobTitle = 'Software Engineer', company = 'Tech Company', useAI = false } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    if (useAI) {
      console.log('🤖 Generating AI cover letter...');
      const coverLetter = await generateCoverLetter(jobTitle, company);
      
      return res.json({ 
        success: true, 
        message: 'AI cover letter generated successfully',
        coverLetter,
        jobTitle,
        company,
        url,
        timestamp: new Date().toISOString()
      });
    }

    return res.json({ 
      success: true, 
      message: 'Job application endpoint is working',
      data: { url, jobTitle, company },
      note: 'Set useAI=true to generate AI cover letter',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in apply endpoint:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// Serve the frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Test page
app.get('/test', (req, res) => {
  res.send(`
    <h1>🚀 Job Applier API Test Page</h1>
    <div style="max-width: 600px; margin: 20px; font-family: Arial;">
      
      <div style="background: #f0f0f0; padding: 15px; margin: 10px 0; border-radius: 5px;">
        <h3>1. Test Hello Endpoint</h3>
        <button onclick="testHello()" style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer;">Test Hello API</button>
        <pre id="helloResult" style="background: white; padding: 10px; margin: 10px 0;"></pre>
      </div>

      <div style="background: #f0f0f0; padding: 15px; margin: 10px 0; border-radius: 5px;">
        <h3>2. Test Apply Endpoint</h3>
        <input type="text" id="jobTitle" placeholder="Job Title" value="Software Engineer" style="width: 100%; padding: 8px; margin: 5px 0;">
        <input type="text" id="company" placeholder="Company" value="Google" style="width: 100%; padding: 8px; margin: 5px 0;">
        <input type="url" id="jobUrl" placeholder="Job URL" value="https://example.com/job" style="width: 100%; padding: 8px; margin: 5px 0;">
        <label><input type="checkbox" id="useAI" checked> Use AI for cover letter</label><br>
        <button onclick="testApply()" style="background: #28a745; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; margin-top: 10px;">Test Apply API</button>
        <pre id="applyResult" style="background: white; padding: 10px; margin: 10px 0;"></pre>
      </div>

      <div style="background: #e9ecef; padding: 15px; margin: 10px 0; border-radius: 5px;">
        <h3>API Endpoints:</h3>
        <ul>
          <li><code>GET /api/hello</code> - Health check</li>
          <li><code>POST /api/apply</code> - Job application with AI</li>
        </ul>
      </div>
    </div>

    <script>
      async function testHello() {
        document.getElementById('helloResult').textContent = 'Testing...';
        try {
          const response = await fetch('/api/hello');
          const data = await response.json();
          document.getElementById('helloResult').textContent = JSON.stringify(data, null, 2);
        } catch (error) {
          document.getElementById('helloResult').textContent = 'Error: ' + error.message;
        }
      }

      async function testApply() {
        document.getElementById('applyResult').textContent = 'Testing...';
        try {
          const response = await fetch('/api/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              url: document.getElementById('jobUrl').value,
              jobTitle: document.getElementById('jobTitle').value,
              company: document.getElementById('company').value,
              useAI: document.getElementById('useAI').checked
            })
          });
          const data = await response.json();
          document.getElementById('applyResult').textContent = JSON.stringify(data, null, 2);
        } catch (error) {
          document.getElementById('applyResult').textContent = 'Error: ' + error.message;
        }
      }
    </script>
  `);
});

// AI Cover Letter Generation
async function generateCoverLetter(jobTitle, company) {
  const prompt = `Write a professional 2-sentence cover letter for applying to the ${jobTitle} role at ${company}. Make it engaging and highlight relevant skills.`;
  
  // Your API key (in production, use environment variables)
  const apiKey = 'AIzaSyD1kgLn9YauYuf0NaKZ7Y8jnKf8CePQlzk';
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (generatedText) {
      console.log('✅ AI cover letter generated successfully');
      return generatedText.trim();
    } else {
      console.log('⚠️ No AI text generated, using fallback');
      return `I am excited to apply for the ${jobTitle} position at ${company}. My technical skills and passion for innovation make me an ideal candidate for this role.`;
    }
  } catch (error) {
    console.error('❌ Gemini API error:', error);
    return `I am excited to apply for the ${jobTitle} position at ${company}. My technical skills and passion for innovation make me an ideal candidate for this role.`;
  }
}

app.listen(PORT, () => {
  console.log(`\n🚀 Job Applier API Server Started!`);
  console.log(`📋 Main Frontend: http://localhost:${PORT}`);
  console.log(`🧪 Test Page: http://localhost:${PORT}/test`);
  console.log(`💫 Hello API: http://localhost:${PORT}/api/hello`);
  console.log(`🎯 Apply API: POST http://localhost:${PORT}/api/apply`);
  console.log(`\n✨ Ready for testing!`);
}); 