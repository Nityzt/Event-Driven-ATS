// src/components/matching/SkillPill.jsx
export const SkillPill = ({ skill, type }) => {
  const getStyle = () => {
    switch (type) {
      case 'required':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'operational':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'hygiene':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStyle()}`}>
      {skill}
    </span>
  );
};

export default SkillPill;