require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User      = require('../models/User');
const Candidate = require('../models/Candidate');
const Job       = require('../models/Job');
const Application = require('../models/Application');
const Workflow  = require('../models/Workflow');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/event-ats';

const TECH_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Vue.js', 'Angular', 'Node.js', 'Express',
  'Python', 'Django', 'FastAPI', 'Java', 'Spring Boot', 'Go', 'Rust',
  'PostgreSQL', 'MongoDB', 'Redis', 'MySQL', 'Elasticsearch',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
  'GraphQL', 'REST APIs', 'Microservices', 'CI/CD', 'Git',
  'Machine Learning', 'TensorFlow', 'PyTorch'
];

const LOCATIONS = [
  'San Francisco, CA', 'New York, NY', 'Austin, TX', 'Seattle, WA',
  'Boston, MA', 'Chicago, IL', 'Denver, CO', 'Remote'
];

const SENIORITY = ['Entry', 'Mid', 'Senior', 'Lead', 'Executive'];

function pick(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const JOB_TEMPLATES = [
  {
    title: 'Senior React Developer',
    description: 'Build and maintain high-performance React applications. Work closely with design and backend teams.',
    requiredSkills: ['React', 'JavaScript', 'TypeScript', 'REST APIs'],
    operationalSkills: ['Vue.js', 'GraphQL', 'Node.js'],
    hygieneSkills: ['Docker', 'CI/CD'],
    seniority: 'Senior'
  },
  {
    title: 'Backend Engineer (Node.js)',
    description: 'Design and implement scalable Node.js microservices. Own the reliability and performance of core APIs.',
    requiredSkills: ['Node.js', 'Express', 'MongoDB', 'REST APIs'],
    operationalSkills: ['TypeScript', 'Redis', 'Docker'],
    hygieneSkills: ['Kubernetes', 'AWS'],
    seniority: 'Mid'
  },
  {
    title: 'Full Stack Engineer',
    description: 'Develop features end-to-end across React frontend and Python/FastAPI backend.',
    requiredSkills: ['React', 'Python', 'PostgreSQL', 'REST APIs'],
    operationalSkills: ['TypeScript', 'FastAPI', 'Docker'],
    hygieneSkills: ['AWS', 'CI/CD'],
    seniority: 'Senior'
  },
  {
    title: 'DevOps Engineer',
    description: 'Own the infrastructure, CI/CD pipelines, and monitoring stack. Drive reliability improvements.',
    requiredSkills: ['Docker', 'Kubernetes', 'CI/CD', 'AWS'],
    operationalSkills: ['Terraform', 'Python', 'Go'],
    hygieneSkills: ['GCP', 'Elasticsearch'],
    seniority: 'Senior'
  },
  {
    title: 'Machine Learning Engineer',
    description: 'Develop and productionize ML models. Collaborate with data scientists to bring research to production.',
    requiredSkills: ['Python', 'Machine Learning', 'TensorFlow', 'REST APIs'],
    operationalSkills: ['PyTorch', 'FastAPI', 'Docker'],
    hygieneSkills: ['AWS', 'Kubernetes'],
    seniority: 'Senior'
  },
  {
    title: 'Frontend Engineer',
    description: 'Craft polished, accessible UI components and collaborate with product on user experiences.',
    requiredSkills: ['React', 'TypeScript', 'JavaScript', 'REST APIs'],
    operationalSkills: ['Vue.js', 'GraphQL'],
    hygieneSkills: ['CI/CD'],
    seniority: 'Mid'
  },
  {
    title: 'Java Backend Engineer',
    description: 'Build and maintain high-throughput Java services. Design robust data pipelines.',
    requiredSkills: ['Java', 'Spring Boot', 'PostgreSQL', 'REST APIs'],
    operationalSkills: ['Microservices', 'Docker', 'Redis'],
    hygieneSkills: ['Kubernetes', 'AWS'],
    seniority: 'Mid'
  },
  {
    title: 'Lead Software Engineer',
    description: 'Technical leader responsible for architecture decisions, code quality, and mentoring a team of 5-8 engineers.',
    requiredSkills: ['JavaScript', 'Node.js', 'React', 'Microservices', 'PostgreSQL'],
    operationalSkills: ['TypeScript', 'Docker', 'AWS', 'CI/CD'],
    hygieneSkills: ['Kubernetes', 'GraphQL'],
    seniority: 'Lead'
  },
  {
    title: 'Data Engineer',
    description: 'Design and maintain scalable data pipelines. Own the data warehouse and ETL infrastructure.',
    requiredSkills: ['Python', 'PostgreSQL', 'Elasticsearch', 'REST APIs'],
    operationalSkills: ['Go', 'Docker', 'AWS'],
    hygieneSkills: ['Kubernetes', 'CI/CD'],
    seniority: 'Mid'
  },
  {
    title: 'Go Backend Engineer',
    description: 'Build high-performance, low-latency services in Go. Work on core platform infrastructure.',
    requiredSkills: ['Go', 'PostgreSQL', 'REST APIs', 'Microservices'],
    operationalSkills: ['Docker', 'Redis', 'AWS'],
    hygieneSkills: ['Kubernetes', 'CI/CD'],
    seniority: 'Senior'
  }
];

const FIRST_NAMES = [
  'Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Isabella', 'James',
  'Karen', 'Leo', 'Mia', 'Nathan', 'Olivia', 'Peter', 'Quinn', 'Rachel', 'Sam', 'Tina',
  'Uma', 'Victor', 'Wendy', 'Xavier', 'Yara', 'Zoe', 'Aaron', 'Bella', 'Carlos', 'Diana',
  'Ethan', 'Fiona', 'George', 'Hana', 'Ivan', 'Julia', 'Kevin', 'Laura', 'Mike', 'Nina',
  'Oscar', 'Priya', 'Ryan', 'Sofia', 'Tom', 'Ursula', 'Vera', 'Will', 'Xia', 'Yusuf'
];
const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Martinez',
  'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Hernandez', 'Moore', 'Jackson', 'Lee', 'Harris',
  'Clark', 'Lewis', 'Robinson', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright',
  'Scott', 'Green', 'Baker', 'Nelson', 'Carter', 'Mitchell', 'Perez', 'Turner', 'Phillips',
  'Campbell', 'Parker', 'Evans', 'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris', 'Rogers',
  'Reed', 'Cook', 'Morgan', 'Bell', 'Murphy'
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing data
  await Promise.all([
    User.deleteMany({}),
    Candidate.deleteMany({}),
    Job.deleteMany({}),
    Application.deleteMany({}),
    Workflow.deleteMany({})
  ]);
  console.log('Cleared existing data');

  // ── Users ────────────────────────────────────────────────────────────────
  const adminPw     = await bcrypt.hash('admin123', 10);
  const recruiterPw = await bcrypt.hash('recruiter123', 10);

  const [admin, recruiter] = await User.insertMany([
    { name: 'Admin User',     email: 'admin@ats.com',     password: adminPw,     role: 'Admin' },
    { name: 'Jane Recruiter', email: 'recruiter@ats.com', password: recruiterPw, role: 'Recruiter' }
  ]);
  console.log('Created 2 users');

  // ── Jobs ─────────────────────────────────────────────────────────────────
  const jobDocs = await Job.insertMany(
    JOB_TEMPLATES.map(t => ({
      ...t,
      location: LOCATIONS[rand(0, LOCATIONS.length - 1)],
      status:   'Open',
      postedBy: recruiter._id
    }))
  );
  console.log(`Created ${jobDocs.length} jobs`);

  // ── Candidates ───────────────────────────────────────────────────────────
  const candidateDocs = [];
  for (let i = 0; i < 50; i++) {
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName  = LAST_NAMES[i % LAST_NAMES.length];
    const name      = `${firstName} ${lastName}`;
    const email     = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    const yearsExp  = rand(1, 10);
    const numSkills = rand(3, 8);
    const skills    = pick(TECH_SKILLS, numSkills);
    const seniority = yearsExp >= 7 ? 'Senior' : yearsExp >= 4 ? 'Mid' : 'Entry';

    candidateDocs.push({
      name,
      email,
      phone:    `+1-555-${String(1000 + i).padStart(4, '0')}`,
      location: LOCATIONS[rand(0, LOCATIONS.length - 1)],
      skills,
      seniority,
      experience: [
        {
          company:     `Tech Corp ${rand(1, 50)}`,
          title:       `${seniority} Developer`,
          startDate:   new Date(Date.now() - yearsExp * 365 * 24 * 60 * 60 * 1000),
          current:     true,
          description: `Working on ${skills.slice(0, 2).join(', ')} projects.`
        }
      ],
      status: 'Active'
    });
  }

  const candidates = await Candidate.insertMany(candidateDocs);
  console.log(`Created ${candidates.length} candidates`);

  // ── Applications (10 samples) ─────────────────────────────────────────────
  const usedPairs = new Set();
  const appDocs   = [];
  const stages    = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];

  for (let i = 0; i < 10; i++) {
    let candidateIdx, jobIdx, key;
    do {
      candidateIdx = rand(0, candidates.length - 1);
      jobIdx       = rand(0, jobDocs.length - 1);
      key          = `${candidateIdx}-${jobIdx}`;
    } while (usedPairs.has(key));
    usedPairs.add(key);

    const stage = stages[rand(0, stages.length - 1)];
    appDocs.push({
      candidateId: candidates[candidateIdx]._id,
      jobId:       jobDocs[jobIdx]._id,
      stage,
      timeline: [{ stage, changedBy: recruiter._id }]
    });
  }

  await Application.insertMany(appDocs);
  console.log(`Created ${appDocs.length} applications`);

  // ── Sample Workflows ──────────────────────────────────────────────────────
  await Workflow.insertMany([
    {
      name:       'Application Received — Welcome Email',
      description: 'Send a welcome email when a candidate applies',
      triggers:   [{ event: 'Application.created' }],
      steps: [
        {
          type:   'sendEmail',
          config: {
            subject: 'We received your application for {{job.title}}!',
            body:    'Hi {{candidate.name}},\n\nThank you for applying to {{job.title}}. We will be in touch soon.\n\nBest,\nThe ATS Team'
          }
        }
      ],
      enabled:   true,
      createdBy: admin._id
    },
    {
      name:       'Interview Stage — SMS + Email',
      description: 'When candidate reaches Interview stage, send SMS then wait 1 hour then send email',
      triggers:   [{ event: 'Stage.changed', conditions: { stage: 'Interview' } }],
      steps: [
        {
          type:   'sendSMS',
          config: { message: 'Hi {{candidate.name}}! You have been selected for an interview for {{job.title}}. Check your email for details.' }
        },
        {
          type:   'wait',
          config: { duration: 1, unit: 'hours' }
        },
        {
          type:   'sendEmail',
          config: {
            subject: 'Interview Invitation — {{job.title}}',
            body:    'Dear {{candidate.name}},\n\nWe are pleased to invite you for an interview for {{job.title}} at {{job.company}}.\n\nPlease confirm your availability.\n\nBest regards,\nHiring Team'
          }
        }
      ],
      enabled:   true,
      createdBy: admin._id
    },
    {
      name:       'Webhook on New Application',
      description: 'Notify an external system via webhook when a new application is created',
      triggers:   [{ event: 'Application.created' }],
      steps: [
        {
          type:   'webhook',
          config: {
            url:     process.env.WEBHOOK_ECHO_URL || 'http://localhost:5001/webhook/echo',
            method:  'POST',
            payload: { event: 'application.created', candidate: '{{candidate.name}}', job: '{{job.title}}' }
          }
        }
      ],
      enabled:   false,
      createdBy: admin._id
    }
  ]);
  console.log('Created 3 sample workflows');

  console.log('\n✅ Seed complete!');
  console.log('   Admin:     admin@ats.com     / admin123');
  console.log('   Recruiter: recruiter@ats.com / recruiter123');

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
