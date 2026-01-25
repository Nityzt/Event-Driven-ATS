const fs = require('fs').promises;
const PDFParser = require('pdf2json');

// Safe URI decode that handles malformed URIs
function safeDecodeURIComponent(str) {
  try {
    return decodeURIComponent(str);
  } catch (e) {
    // If decoding fails, return the original string
    return str;
  }
}

// Extract text from PDF file using pdf2json
exports.extractTextFromPDF = async (filePath) => {
  console.log('Attempting to parse PDF:', filePath);
  
  return new Promise((resolve, reject) => {
    const pdfParser = new PDFParser();
    
    pdfParser.on('pdfParser_dataError', errData => {
      console.error('PDF parsing error:', errData.parserError);
      resolve(''); // Return empty string on error
    });
    
    pdfParser.on('pdfParser_dataReady', pdfData => {
      try {
        console.log('PDF data ready for processing');
        console.log('Number of pages in PDF:', pdfData.Pages ? pdfData.Pages.length : 0);
        
        // Extract text from all pages
        let text = '';
        if (pdfData.Pages) {
          pdfData.Pages.forEach((page, pageIndex) => {
            console.log(`Processing page ${pageIndex + 1}...`);
            if (page.Texts) {
              page.Texts.forEach(textItem => {
                if (textItem.R) {
                  textItem.R.forEach(r => {
                    // Use safe decode to handle malformed URIs
                    const decoded = safeDecodeURIComponent(r.T);
                    text += decoded + ' ';
                  });
                }
              });
            }
          });
        }
        
        console.log('Extracted text length:', text.length);
        console.log('First 200 chars:', text.substring(0, 200));
        resolve(text.trim());
      } catch (error) {
        console.error('Error processing PDF data:', error);
        resolve('');
      }
    });
    
    pdfParser.loadPDF(filePath);
  });
};

// Enhanced skill extraction using regex
exports.extractSkills = (text) => {
  if (!text) {
    console.log('No text provided for skill extraction');
    return [];
  }
  
  console.log('Extracting skills from text...');
  
  // Comprehensive tech skills list
  const skillPatterns = [
    // Programming Languages
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C\\+\\+', 'C#', 'Ruby', 'PHP', 
    'Swift', 'Kotlin', 'Go', 'Rust', 'C', 'Scala', 'R',
    
    // Frontend
    'React', 'React\\.js', 'Angular', 'Vue', 'Vue\\.js', 'Svelte', 'Next\\.js',
    'HTML', 'HTML5', 'CSS', 'CSS3', 'Sass', 'SCSS', 'TailwindCSS', 'Tailwind CSS',
    'Bootstrap', 'Material UI', 'jQuery', 'GSAP', 'Responsive Design',
    
    // Backend
    'Node\\.js', 'Express', 'Express\\.js', 'Django', 'Flask', 'Spring', 'Spring Boot',
    'FastAPI', 'Laravel', 'Ruby on Rails', 'ASP\\.NET',
    
    // Databases
    'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'SQL', 'NoSQL', 'SQLite',
    'Firebase', 'Firestore', 'DynamoDB', 'Cassandra', 'Oracle',
    'Database Design', 'Schema Design',
    
    // Cloud & DevOps
    'AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD',
    'Jenkins', 'GitHub Actions', 'GitLab CI', 'Terraform', 'Ansible',
    
    // Tools & Platforms
    'Git', 'GitHub', 'GitLab', 'Bitbucket', 'Linux', 'Unix', 'Bash',
    'REST API', 'GraphQL', 'WebSocket', 'Socket\\.IO',
    'Vercel', 'Render', 'Heroku', 'Netlify', 'Arduino',
    
    // Methodologies & Concepts
    'Agile', 'Scrum', 'Kanban', 'TDD', 'CRUD', 'API Integration',
    'OOP', 'Object-Oriented Programming', 'Data Structures',
    'Algorithms', 'System Design', 'Computer Security',
    
    // Creative Tools
    'Adobe After Effects', 'Adobe Premiere Pro', 'Blender',
    
    // Other
    'Machine Learning', 'Data Science', 'TensorFlow', 'PyTorch'
  ];
  
  const foundSkills = new Set();
  
  skillPatterns.forEach(skill => {
    // Use word boundaries for accurate matching
    const regex = new RegExp(`\\b${skill}\\b`, 'gi');
    if (regex.test(text)) {
      // Normalize the skill name (remove escape characters)
      const normalizedSkill = skill
        .replace(/\\\./g, '.')
        .replace(/\\\+/g, '+')
        .replace(/\\/g, '');
      foundSkills.add(normalizedSkill);
    }
  });
  
  console.log('Found skills:', Array.from(foundSkills));
  return Array.from(foundSkills);
};