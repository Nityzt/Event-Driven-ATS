// src/hooks/usePagination.js
import { useState, useEffect } from 'react';

/**
 * Hook for cursor-based pagination
 * @param {Function} fetchFn - Function to fetch data
 * @param {number} limit - Items per page
 * @returns {object} - Pagination state and controls
 */
const usePagination = (fetchFn, limit = 20) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null);
  const [error, setError] = useState(null);

  const loadMore = async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetchFn({ cursor, limit });
      const newData = response.data || response;
      
      setData((prev) => [...prev, ...newData]);
      setCursor(response.nextCursor);
      setHasMore(!!response.nextCursor && newData.length === limit);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setData([]);
    setCursor(null);
    setHasMore(true);
    setError(null);
  };

  useEffect(() => {
    loadMore();
  });

  return {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    reset
  };
};

export { usePagination };