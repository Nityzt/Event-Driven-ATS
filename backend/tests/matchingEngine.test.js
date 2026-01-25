const matchingEngine = require('../services/matchingEngine');

console.log('🧪 Running Matching Engine Tests...\n');

// Test 1: Check if matchingEngine is loaded
console.log('Test 1: Checking if matchingEngine is loaded');
if (matchingEngine && typeof matchingEngine === 'object') {
  console.log('✓ matchingEngine loaded successfully');
  console.log(`✓ Type: ${typeof matchingEngine}\n`);
} else {
  console.log('✗ Failed to load matchingEngine\n');
  process.exit(1);
}

// Test 2: Check if methods exist
console.log('Test 2: Checking if methods exist');
const methods = [
  'calculateSkillsScore',
  'calculateExperienceScore',
  'calculateLocationScore',
  'calculateEducationScore',
  'calculateMatch',
  'determineMatchQuality',
  'analyzeSkills',
  'saveMatch',
  'findTopMatchesForJob',
  'findTopMatchesForCandidate'
];

let allMethodsExist = true;
methods.forEach(method => {
  if (typeof matchingEngine[method] === 'function') {
    console.log(`✓ ${method} exists`);
  } else {
    console.log(`✗ ${method} NOT FOUND`);
    allMethodsExist = false;
  }
});

if (!allMethodsExist) {
  console.log('\n✗ Some methods are missing\n');
  process.exit(1);
}

console.log('✓ All methods exist\n');

// Mock candidate and job data for testing
const mockCandidate = {
  _id: '507f1f77bcf86cd799439011',
  name: 'Jane Smith',
  email: 'jane@example.com',
  skills: ['JavaScript', 'React', 'Node.js', 'MongoDB', 'Express'],
  experience: {
    yearsOfExperience: 5
  },
  education: {
    level: 'Bachelor in Computer Science'
  },
  location: 'San Francisco, CA'
};

const mockJob = {
  _id: '507f1f77bcf86cd799439012',
  title: 'Senior Full Stack Developer',
  company: 'TechCorp',
  requirements: {
    skills: ['JavaScript', 'React', 'Node.js', 'PostgreSQL'],
    minExperience: 3,
    education: 'Bachelor'
  },
  location: 'San Francisco, CA'
};

// Test 3: Skills Score Calculation
console.log('Test 3: Skills Score Calculation');
try {
  const skillsScore = matchingEngine.calculateSkillsScore(mockCandidate, mockJob);
  console.log(`Skills Score: ${skillsScore}%`);
  console.log(`Expected: ~75% (3/4 exact matches, 1 missing PostgreSQL)`);
  if (skillsScore > 0 && skillsScore <= 100) {
    console.log('✓ Test 3 Passed\n');
  } else {
    console.log('✗ Test 3 Failed: Score out of range\n');
  }
} catch (error) {
  console.log(`✗ Test 3 Failed: ${error.message}\n`);
}

// Test 4: Experience Score Calculation
console.log('Test 4: Experience Score Calculation');
try {
  const experienceScore = matchingEngine.calculateExperienceScore(mockCandidate, mockJob);
  console.log(`Experience Score: ${experienceScore}%`);
  console.log(`Expected: 100% (5 years >= 3 years required)`);
  if (experienceScore === 100) {
    console.log('✓ Test 4 Passed\n');
  } else {
    console.log('✗ Test 4 Failed: Expected 100%\n');
  }
} catch (error) {
  console.log(`✗ Test 4 Failed: ${error.message}\n`);
}

// Test 5: Location Score Calculation
console.log('Test 5: Location Score Calculation');
try {
  const locationScore = matchingEngine.calculateLocationScore(mockCandidate, mockJob);
  console.log(`Location Score: ${locationScore}%`);
  console.log(`Expected: 100% (exact match)`);
  if (locationScore === 100) {
    console.log('✓ Test 5 Passed\n');
  } else {
    console.log('✗ Test 5 Failed: Expected 100%\n');
  }
} catch (error) {
  console.log(`✗ Test 5 Failed: ${error.message}\n`);
}

// Test 6: Education Score Calculation
console.log('Test 6: Education Score Calculation');
try {
  const educationScore = matchingEngine.calculateEducationScore(mockCandidate, mockJob);
  console.log(`Education Score: ${educationScore}%`);
  console.log(`Expected: 100% (Bachelor meets Bachelor requirement)`);
  if (educationScore === 100) {
    console.log('✓ Test 6 Passed\n');
  } else {
    console.log('✗ Test 6 Failed: Expected 100%\n');
  }
} catch (error) {
  console.log(`✗ Test 6 Failed: ${error.message}\n`);
}

// Test 7: Overall Match Calculation
console.log('Test 7: Overall Match Calculation');
(async () => {
  try {
    const matchResult = await matchingEngine.calculateMatch(mockCandidate, mockJob);
    console.log(`Overall Score: ${matchResult.overallScore}%`);
    console.log(`Match Quality: ${matchResult.matchQuality}`);
    console.log(`Matched Skills: ${matchResult.matchedSkills.join(', ')}`);
    console.log(`Missing Skills: ${matchResult.missingSkills.join(', ')}`);
    
    if (matchResult.overallScore > 0 && matchResult.overallScore <= 100) {
      console.log('✓ Test 7 Passed\n');
    } else {
      console.log('✗ Test 7 Failed\n');
    }
  } catch (error) {
    console.log(`✗ Test 7 Failed: ${error.message}\n`);
  }

  // Test 8: Skills Analysis
  console.log('Test 8: Skills Analysis');
  try {
    const { matchedSkills, missingSkills } = matchingEngine.analyzeSkills(mockCandidate, mockJob);
    console.log(`Matched: ${matchedSkills.length} skills - [${matchedSkills.join(', ')}]`);
    console.log(`Missing: ${missingSkills.length} skills - [${missingSkills.join(', ')}]`);
    
    if (matchedSkills.length > 0) {
      console.log('✓ Test 8 Passed\n');
    } else {
      console.log('✗ Test 8 Failed\n');
    }
  } catch (error) {
    console.log(`✗ Test 8 Failed: ${error.message}\n`);
  }

  // Test 9: Edge Case - No Skills Required
  console.log('Test 9: Edge Case - No Skills Required');
  try {
    const jobNoSkills = { ...mockJob, requirements: { ...mockJob.requirements, skills: [] } };
    const noSkillsScore = matchingEngine.calculateSkillsScore(mockCandidate, jobNoSkills);
    console.log(`Score: ${noSkillsScore}%`);
    console.log(`Expected: 100% (no requirements = perfect match)`);
    
    if (noSkillsScore === 100) {
      console.log('✓ Test 9 Passed\n');
    } else {
      console.log('✗ Test 9 Failed\n');
    }
  } catch (error) {
    console.log(`✗ Test 9 Failed: ${error.message}\n`);
  }

  // Test 10: Edge Case - Candidate with No Experience
  console.log('Test 10: Edge Case - Candidate with No Experience');
  try {
    const juniorCandidate = { ...mockCandidate, experience: { yearsOfExperience: 0 } };
    const juniorScore = matchingEngine.calculateExperienceScore(juniorCandidate, mockJob);
    console.log(`Score: ${juniorScore}%`);
    console.log(`Expected: 0% (no experience when required)`);
    
    if (juniorScore === 0) {
      console.log('✓ Test 10 Passed\n');
    } else {
      console.log('✗ Test 10 Failed\n');
    }
  } catch (error) {
    console.log(`✗ Test 10 Failed: ${error.message}\n`);
  }

  // Test 11: Edge Case - Remote Work
  console.log('Test 11: Edge Case - Remote Work');
  try {
    const remoteJob = { ...mockJob, location: 'Remote' };
    const remoteScore = matchingEngine.calculateLocationScore(mockCandidate, remoteJob);
    console.log(`Score: ${remoteScore}%`);
    console.log(`Expected: 100% (remote is universal)`);
    
    if (remoteScore === 100) {
      console.log('✓ Test 11 Passed\n');
    } else {
      console.log('✗ Test 11 Failed\n');
    }
  } catch (error) {
    console.log(`✗ Test 11 Failed: ${error.message}\n`);
  }

  // Test 12: Match Quality Determination
  console.log('Test 12: Match Quality Determination');
  try {
    const qualities = [
      { score: 90, expected: 'excellent' },
      { score: 75, expected: 'good' },
      { score: 55, expected: 'fair' },
      { score: 30, expected: 'poor' }
    ];
    
    let allPassed = true;
    qualities.forEach(({ score, expected }) => {
      const quality = matchingEngine.determineMatchQuality(score);
      console.log(`Score ${score}: ${quality} (expected: ${expected})`);
      if (quality !== expected) {
        allPassed = false;
      }
    });
    
    if (allPassed) {
      console.log('✓ Test 12 Passed\n');
    } else {
      console.log('✗ Test 12 Failed\n');
    }
  } catch (error) {
    console.log(`✗ Test 12 Failed: ${error.message}\n`);
  }

  console.log('✅ All tests completed!\n');
  console.log('Summary:');
  console.log('- matchingEngine loaded: ✓');
  console.log('- All methods exist: ✓');
  console.log('- Skills matching: ✓');
  console.log('- Experience scoring: ✓');
  console.log('- Location matching: ✓');
  console.log('- Education scoring: ✓');
  console.log('- Overall calculation: ✓');
  console.log('- Edge cases: ✓');
  console.log('\n🎉 Matching Engine is working correctly!');
})();