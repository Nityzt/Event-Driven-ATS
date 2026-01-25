const eventEmitter = require('./eventEmitter');

eventEmitter.on('matchCreated', (match) => {
  console.log('📣 Match created:', match._id);
});

const matchingEngine = require('./matchingEngine');

// Auto-calculate match when a new application is created
eventEmitter.on('application:created', async (data) => {
  try {
    console.log(`[MatchListener] Calculating match for application ${data.applicationId}`);
    
    const match = await matchingEngine.saveMatch(
      data.candidateId,
      data.jobId,
      data.applicationId
    );

    console.log(`[MatchListener] Match calculated: ${match.overallScore}% (${match.matchQuality})`);
    
    // Emit event with match results
    eventEmitter.emit('match:calculated', {
      matchId: match._id,
      applicationId: data.applicationId,
      score: match.overallScore,
      quality: match.matchQuality
    });
  } catch (error) {
    console.error('[MatchListener] Error calculating match:', error);
  }
});

// Recalculate matches when candidate profile is updated
eventEmitter.on('candidate:updated', async (data) => {
  try {
    console.log(`[MatchListener] Recalculating matches for candidate ${data.candidateId}`);
    
    const matches = await matchingEngine.recalculateCandidateMatches(data.candidateId);
    
    console.log(`[MatchListener] Recalculated ${matches.length} matches for candidate`);
  } catch (error) {
    console.error('[MatchListener] Error recalculating candidate matches:', error);
  }
});

// Recalculate matches when job requirements are updated
eventEmitter.on('job:updated', async (data) => {
  try {
    console.log(`[MatchListener] Recalculating matches for job ${data.jobId}`);
    
    const matches = await matchingEngine.recalculateJobMatches(data.jobId);
    
    console.log(`[MatchListener] Recalculated ${matches.length} matches for job`);
  } catch (error) {
    console.error('[MatchListener] Error recalculating job matches:', error);
  }
});

// Log high-quality matches
eventEmitter.on('match:high-quality', (data) => {
  console.log(`[MatchListener] 🎯 High-quality match detected! Score: ${data.score}% (${data.quality})`);
  // Future: Send notification to recruiter
  // Future: Auto-schedule interview for excellent matches
});

console.log('[MatchListener] Match event listeners registered');

module.exports = eventEmitter;