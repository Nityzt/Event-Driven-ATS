export const ScoreBar = ({ score }) => {
  const getColor = () => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-brand-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="w-32 h-2 bg-stone-200 dark:bg-stone-700 rounded-full overflow-hidden mt-1">
      <div
        className={`h-full ${getColor()} transition-all duration-500`}
        style={{ width: `${Math.min(score, 100)}%` }}
      />
    </div>
  );
};

export default ScoreBar;