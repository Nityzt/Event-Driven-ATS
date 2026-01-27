const Agenda = require('agenda');
const mongoose = require('mongoose');

const agenda = new Agenda({
  mongo: mongoose.connection,
  db: { collection: 'agendaJobs' },
  processEvery: '30 seconds',
  maxConcurrency: 20,
  defaultConcurrency: 5,
  defaultLockLimit: 0,
  defaultLockLifetime: 10000,
});

const graceful = () => {
  agenda.stop(() => {
    console.log('[Agenda] Gracefully stopped');
    process.exit(0);
  });
};

process.on('SIGTERM', graceful);
process.on('SIGINT', graceful);

module.exports = agenda;