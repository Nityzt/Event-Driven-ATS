// src/components/matching/ScoreBar.jsx
export const ScoreBar = ({ score }) => {
  const getColor = (score) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-blue-500';
    if (score >= 40) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden mt-1">
      <div
        className={`h-full ${getColor(score)} transition-all duration-300`}
        style={{ width: `${Math.min(score, 100)}%` }}
      />
    </div>
  );
};



export default { ScoreBar };