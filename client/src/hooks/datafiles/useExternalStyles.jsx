import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

// The shared set of external stylesheets for your components
const EXTERNAL_STYLESHEETS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css',
  // Add your actual stylesheet URLs here
];

function useExternalStyles() {
  const hostRef = useRef();
  const shadowRootRef = useRef();
  const reactRootRef = useRef();
  const [areStylesLoaded, setAreStylesLoaded] = useState(false);

  useEffect(() => {
    if (!hostRef.current) return;

    // To isolate styles to only apply to what we render
    shadowRootRef.current = hostRef.current.attachShadow({ mode: 'open' });

    let loadedStylesheetsCount = 0;
    const totalStylesheets = EXTERNAL_STYLESHEETS.length;
    const checkAllLoaded = () => {
      loadedStylesheetsCount++;
      if (loadedStylesheetsCount === totalStylesheets) {
        setAreStylesLoaded(true);
      }
    };

    EXTERNAL_STYLESHEETS.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = checkAllLoaded;
      link.onerror = checkAllLoaded; // Still proceed even if one fails
      shadowRootRef.current.appendChild(link);
    });

    if (totalStylesheets === 0) {
      setStylesLoaded(true);
    }

    return () => {
      if (reactRootRef.current) {
        reactRootRef.current.unmount();
      }
    };
  }, []);

  const renderWithStyles = (children) => {
    if (!areStylesLoaded || !shadowRootRef.current) return;

    if (!reactRootRef.current) {
      const container = document.createElement('div');
      shadowRootRef.current.appendChild(container);
      reactRootRef.current = createRoot(container);
    }

    reactRootRef.current.render(children);
  };

  return {
    hostRef,
    areStylesLoaded,
    renderWithStyles,
  };
}

export default useExternalStyles;