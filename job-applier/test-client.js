import axios from 'axios';

// Test the job application API
async function testJobApplication() {
  try {
    console.log('Testing job application API...');
    
    const response = await axios.post('http://localhost:3000/api/apply', {
      url: 'https://example-job-site.com/apply',  // Replace with actual job URL
      jobTitle: 'Software Engineer',
      company: 'Example Company',
      useAI: true
    });

    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

// Test health endpoint
async function testHealth() {
  try {
    const response = await axios.get('http://localhost:3000/health');
    console.log('Health check:', response.data);
  } catch (error) {
    console.error('Health check failed:', error.message);
  }
}

// Run tests
console.log('🧪 Running API tests...\n');
await testHealth();
await testJobApplication(); 