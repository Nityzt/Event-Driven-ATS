import { useState } from 'react';
import { Mail, Phone, MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import ScoreBar from './ScoreBar';
import SkillPill from './SkillPill';
import Badge from '../ui/Badge';

const QUALITY_VARIANT = {
  excellent: 'success',
  good:      'info',
  fair:      'warning',
  poor:      'danger',
};

const CandidateList = ({ matches }) => {
  const [expandedCandidate, setExpandedCandidate] = useState(null);

  return (
    <div className="space-y-3">
      {matches.map(match => {
        const isExpanded = expandedCandidate === match.candidate._id;
        const candidate = match.candidate;
        const score = match.overallScore ?? match.score ?? 0;

        return (
          <div key={match._id} className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-card overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-brand-700 dark:text-brand-300 text-sm font-semibold flex-shrink-0">
                    {candidate.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{candidate.name}</p>
                      {match.matchQuality && (
                        <Badge variant={QUALITY_VARIANT[match.matchQuality] || 'default'} size="sm">
                          {match.matchQuality}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                      {candidate.email && (
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{candidate.email}</span>
                      )}
                      {candidate.phone && (
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{candidate.phone}</span>
                      )}
                      {candidate.location && (
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{candidate.location}</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 ml-3">
                  <div className="text-xl font-bold text-brand-600 dark:text-brand-400">{Math.round(score)}%</div>
                  <ScoreBar score={score} />
                </div>
              </div>

              <div className="space-y-2">
                {match.matchedSkills?.required?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Required Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {match.matchedSkills.required.map((skill, idx) => (
                        <SkillPill key={idx} skill={skill} type="required" />
                      ))}
                    </div>
                  </div>
                )}
                {match.matchedSkills?.operational?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">Operational Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {match.matchedSkills.operational.map((skill, idx) => (
                        <SkillPill key={idx} skill={skill} type="operational" />
                      ))}
                    </div>
                  </div>
                )}
                {match.matchedSkills?.hygiene?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-stone-500 dark:text-stone-400 mb-1">
                      Hygiene Skills <span className="text-green-600 dark:text-green-400">(+5% each)</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {match.matchedSkills.hygiene.map((skill, idx) => (
                        <SkillPill key={idx} skill={skill} type="hygiene" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={() => setExpandedCandidate(isExpanded ? null : candidate._id)}
                className="mt-3 text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 flex items-center gap-1 transition-colors"
              >
                {isExpanded
                  ? <><ChevronUp className="w-3.5 h-3.5" />Show Less</>
                  : <><ChevronDown className="w-3.5 h-3.5" />Show More</>
                }
              </button>
            </div>

            {isExpanded && (
              <div className="border-t border-stone-100 dark:border-stone-800 p-4 bg-stone-50 dark:bg-stone-800/60 space-y-3">
                {candidate.experience?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">Experience</p>
                    <div className="space-y-2">
                      {candidate.experience.map((exp, idx) => (
                        <div key={idx} className="text-xs">
                          <p className="font-medium text-stone-800 dark:text-stone-200">{exp.title}</p>
                          <p className="text-stone-500 dark:text-stone-400">{exp.company}</p>
                          {exp.duration && (
                            <p className="text-stone-400 dark:text-stone-500 flex items-center gap-1 mt-0.5">
                              <Calendar className="w-3 h-3" />{exp.duration}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {candidate.skills?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">All Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {candidate.skills.map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-stone-200 dark:bg-stone-700 text-stone-600 dark:text-stone-400 rounded-full text-xs">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {(match.missingSkills?.required?.length > 0 || match.missingSkills?.operational?.length > 0) && (
                  <div>
                    <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">Missing Skills</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[...(match.missingSkills.required || []), ...(match.missingSkills.operational || [])].map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-full text-xs line-through">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-stone-700 dark:text-stone-300 mb-2">Score Breakdown</p>
                  <div className="space-y-1 text-xs">
                    {match.breakdown && (
                      <>
                        <div className="flex justify-between text-stone-600 dark:text-stone-400">
                          <span>Skills (50%)</span>
                          <span>{Math.round(match.breakdown.skillsScore)}%</span>
                        </div>
                        <div className="flex justify-between text-stone-600 dark:text-stone-400">
                          <span>Experience (30%)</span>
                          <span>{Math.round(match.breakdown.experienceScore)}%</span>
                        </div>
                        <div className="flex justify-between text-stone-600 dark:text-stone-400">
                          <span>Location (10%)</span>
                          <span>{Math.round(match.breakdown.locationScore)}%</span>
                        </div>
                        <div className="flex justify-between text-stone-600 dark:text-stone-400">
                          <span>Education (10%)</span>
                          <span>{Math.round(match.breakdown.educationScore)}%</span>
                        </div>
                      </>
                    )}
                    {match.matchedSkills?.hygiene?.length > 0 && (
                      <div className="flex justify-between text-stone-600 dark:text-stone-400">
                        <span>Hygiene Bonus</span>
                        <span className="text-green-600 dark:text-green-400">+{match.matchedSkills.hygiene.length * 5}%</span>
                      </div>
                    )}
                    <div className="flex justify-between border-t border-stone-200 dark:border-stone-800 pt-1 mt-1 font-semibold text-stone-800 dark:text-stone-200">
                      <span>Overall</span>
                      <span className="text-brand-600 dark:text-brand-400">{Math.round(score)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CandidateList;
