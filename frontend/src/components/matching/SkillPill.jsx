export const SkillPill = ({ skill, type }) => {
  const styles = {
    required:    'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800',
    operational: 'bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border-brand-200 dark:border-brand-800',
    hygiene:     'bg-green-50 dark:bg-green-950/40 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800',
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${styles[type] || 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-800'}`}>
      {skill}
    </span>
  );
};

export default SkillPill;