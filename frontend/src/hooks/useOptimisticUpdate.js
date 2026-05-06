// src/hooks/useOptimisticUpdate.js
import { useState } from 'react';

/**
 * Hook for optimistic UI updates
 * @param {Function} updateFn - Async function that performs the actual update
 * @returns {object} - { execute, isLoading, error }
 */
const useOptimisticUpdate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = async (optimisticUpdate, updateFn, rollbackFn) => {
    setIsLoading(true);
    setError(null);

    // Apply optimistic update immediately
    optimisticUpdate();

    try {
      // Perform actual update
      await updateFn();
    } catch (err) {
      // Rollback on failure
      if (rollbackFn) {
        rollbackFn();
      }
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, isLoading, error };
};

export { useOptimisticUpdate };
