require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Candidate = require('../models/Candidate');
const Job = require('../models/Job');
const engine = require('../services/matchingEngine');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/event-ats';

/**
 * Populate the Match collection so the Matching screen has data.
 * `npm run seed` inserts applications directly and never computes matches, so the
 * board is empty until this runs.
 *
 * Usage:
 *   node scripts/seed-matches.js          → all candidates × first 2 jobs (good demo board)
 *   node scripts/seed-matches.js 3        → all candidates × first 3 jobs
 *   node scripts/seed-matches.js all      → every candidate × every job (50×10 = 500)
 *
 * Point MONGO_URI at your deployed DB to seed prod, e.g.:
 *   MONGO_URI="mongodb+srv://…" node scripts/seed-matches.js
 */
(async () => {
  const arg = process.argv[2];
  await mongoose.connect(MONGO_URI);
  console.log('Connected:', MONGO_URI.replace(/\/\/[^@]*@/, '//***@'));

  const jobQuery = Job.find().sort({ createdAt: 1 });
  if (arg !== 'all') jobQuery.limit(Number(arg) || 2);

  const [jobs, candidates] = await Promise.all([jobQuery, Candidate.find()]);

  if (!jobs.length || !candidates.length) {
    console.error('No jobs or candidates found — run `npm run seed` first.');
    await mongoose.disconnect();
    process.exit(1);
  }

  let count = 0;
  for (const job of jobs) {
    for (const c of candidates) {
      await engine.saveMatch(c._id, job._id);
      count++;
    }
    console.log(`Scored ${candidates.length} candidates for "${job.title}"`);
  }

  console.log(`\n✅ Created/updated ${count} matches across ${jobs.length} job(s).`);
  await mongoose.disconnect();
})().catch(err => {
  console.error('seed-matches failed:', err);
  process.exit(1);
});
