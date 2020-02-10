import { useState, useEffect } from 'react';
import fetch from 'cross-fetch';

const useFetch = (url, options) => {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const FetchData = async () => {
      try {
        if (!cancelled) {
          const res = await fetch(url, {
            credentials: 'same-origin',
            ...options
          });
          const json = await res.json();
          setResponse(json);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err);
        }
      }
    };
    FetchData();
    return () => {
      cancelled = true;
    };
  }, []);
  return { response, error };
};

export default useFetch;
