// src/components/matching/CandidateList.jsx
import { useState } from 'react';
import { Mail, Phone, MapPin, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import ScoreBar from './ScoreBar';
import SkillPill from './SkillPill';

const CandidateList = ({ matches }) => {
  const [expandedCandidate, setExpandedCandidate] = useState(null);

  const toggleExpand = (candidateId) => {
    setExpandedCandidate(expandedCandidate === candidateId ? null : candidateId);
  };

  return (
    <div className="space-y-4">
      {matches.map((match) => {
        const isExpanded = expandedCandidate === match.candidate._id;
        const candidate = match.candidate;

        return (
          <div
            key={match._id}
            className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            {/* Main Card */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800">
                    {candidate.name}
                  </h3>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                    {candidate.email && (
                      <div className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        <span>{candidate.email}</span>
                      </div>
                    )}
                    {candidate.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        <span>{candidate.phone}</span>
                      </div>
                    )}
                    {candidate.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{candidate.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Score */}
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(match.score)}%
                  </div>
                  <ScoreBar score={match.score} />
                </div>
              </div>

              {/* Skills */}
              <div className="space-y-2">
                {/* Required Skills */}
                {match.matchedSkills?.required?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Required Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {match.matchedSkills.required.map((skill, idx) => (
                        <SkillPill key={idx} skill={skill} type="required" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Operational Skills */}
                {match.matchedSkills?.operational?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">Operational Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {match.matchedSkills.operational.map((skill, idx) => (
                        <SkillPill key={idx} skill={skill} type="operational" />
                      ))}
                    </div>
                  </div>
                )}

                {/* Hygiene Skills */}
                {match.matchedSkills?.hygiene?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      Hygiene Skills <span className="text-green-600">(+5% each)</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {match.matchedSkills.hygiene.map((skill, idx) => (
                        <SkillPill key={idx} skill={skill} type="hygiene" />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Expand/Collapse Button */}
              <button
                onClick={() => toggleExpand(candidate._id)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
              >
                {isExpanded ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Show More
                  </>
                )}
              </button>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="border-t border-gray-200 p-4 bg-gray-50 space-y-3">
                {/* Experience */}
                {candidate.experience?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Experience</h4>
                    <div className="space-y-2">
                      {candidate.experience.map((exp, idx) => (
                        <div key={idx} className="text-sm">
                          <p className="font-medium text-gray-800">{exp.title}</p>
                          <p className="text-gray-600">{exp.company}</p>
                          {exp.duration && (
                            <p className="text-gray-500 text-xs flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {exp.duration}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Skills */}
                {candidate.skills?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">All Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-xs"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resume Link */}
                {candidate.resume && (
                  <div>
                    <a
                      href={candidate.resume}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                      View Resume
                    </a>
                  </div>
                )}

                {/* Match Breakdown */}
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">Score Breakdown</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Base Match:</span>
                      <span className="font-medium">{Math.round(match.baseScore || match.score)}%</span>
                    </div>
                    {match.matchedSkills?.hygiene?.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hygiene Bonus:</span>
                        <span className="font-medium text-green-600">
                          +{match.matchedSkills.hygiene.length * 5}%
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between border-t pt-1 mt-1">
                      <span className="font-semibold text-gray-800">Final Score:</span>
                      <span className="font-bold text-blue-600">{Math.round(match.score)}%</span>
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