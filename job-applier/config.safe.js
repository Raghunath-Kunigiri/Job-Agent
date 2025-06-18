// Safe configuration - use environment variables for sensitive data
export const config = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'your_actual_gemini_api_key_here',
  PORT: process.env.PORT || 3000,
  
  // Personal information for form filling
  PERSONAL_INFO: {
    firstName: process.env.FIRST_NAME || 'Raghunath',
    lastName: process.env.LAST_NAME || 'Kunigiri',
    email: process.env.EMAIL || 'kunigiriraghun@example.com',
    location: process.env.LOCATION || 'St. Louis, MO'
  },
  
  // Resume file path
  RESUME_PATH: process.env.RESUME_PATH || './RAGHUNATH_KUNIGIRI.pdf'
}; 