export const SkillPill = ({ skill, type }) => {
  const styles = {
    required:    'bg-red-50 text-red-700 border-red-200',
    operational: 'bg-brand-50 text-brand-700 border-brand-200',
    hygiene:     'bg-green-50 text-green-700 border-green-200',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[type] || 'bg-stone-100 text-stone-700 border-stone-200'}`}>
      {skill}
    </span>
  );
};

export default SkillPill;