import MatchingScreen from '../components/matching/MatchingScreen';
import ErrorBoundary from '../components/common/ErrorBoundary';

const Matches = () => {
  return (
    <ErrorBoundary>
      <MatchingScreen />
    </ErrorBoundary>
  );
};

export default Matches;