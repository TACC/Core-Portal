import { useState, useEffect } from 'react';
import fetch from 'cross-fetch';

const useFetch = (url, options) => {
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const FetchData = async () => {
      try {
        const res = await fetch(url, { credentials: 'same-origin', ...options});
        const json = await res.json();
        setResponse(json);
      } catch (err) {
        setError(err);
      }
    };
    FetchData();
  }, []);
  return { response, error };
};

export default useFetch;
