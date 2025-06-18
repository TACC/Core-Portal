import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

const DEFAULT_STYLESHEETS = [
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600',
  'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.0/font/bootstrap-icons.css',
];

function useExternalStyles(externalStylesheets = DEFAULT_STYLESHEETS) {
  const hostRef = useRef();
  const shadowRootRef = useRef();
  const reactRootRef = useRef();
  const [styleStatus, setStyleStatus] = useState({
    loaded: [],
    failed: [],
    completed: false
  });

  useEffect(() => {
    if (!hostRef.current) {
      console.warn('No hostRef.current found');
      return;
    }

    if (!shadowRootRef.current) {
      try {
        shadowRootRef.current = hostRef.current.shadowRoot || 
          hostRef.current.attachShadow({ mode: 'open' });
      } catch (error) {
        console.error('Failed to create shadow root:', error);
        return;
      }
    }

    const totalStylesheets = externalStylesheets.length;
    
    const checkAllComplete = (loaded, failed) => {
      if (loaded.length + failed.length === totalStylesheets) {
        console.log('Style loading complete:', {
          succeeded: loaded,
          failed: failed
        });
        setStyleStatus({
          loaded,
          failed,
          completed: true
        });
      }
    };

    if (totalStylesheets === 0) {
      setStyleStatus({ loaded: [], failed: [], completed: true });
      return;
    }

    // Remove any existing stylesheets before adding new ones
    const existingLinks = shadowRootRef.current.querySelectorAll('link');
    existingLinks.forEach(link => link.remove());

    const loaded = [];
    const failed = [];

    externalStylesheets.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = () => {
        loaded.push(url);
        checkAllComplete(loaded, failed);
      };
      link.onerror = (error) => {
        console.error(`Failed to load stylesheet: ${url}`, error);
        failed.push(url);
        checkAllComplete(loaded, failed);
      };
      shadowRootRef.current.appendChild(link);
    });

    return () => {
      if (reactRootRef.current) {
        // Unmount the React root first
        reactRootRef.current.unmount();
        reactRootRef.current = null;
      }

      // Clean up stylesheets
      const links = shadowRootRef.current?.querySelectorAll('link');
      links?.forEach(link => link.remove());

      // Reset the status
      setStyleStatus({
        loaded: [],
        failed: [],
        completed: false
      });
    };
  }, [externalStylesheets]);

  const renderWithStyles = (children) => {
    if (!shadowRootRef.current) {
      console.warn('Cannot render: no shadow root');
      return;
    }

    if (!reactRootRef.current) {
      // Clean up any existing container
      const existingContainer = shadowRootRef.current.querySelector('div');
      if (existingContainer) {
        existingContainer.remove();
      }

      const container = document.createElement('div');
      shadowRootRef.current.appendChild(container);
      reactRootRef.current = createRoot(container);
    }

    if (styleStatus.failed.length > 0) {
      console.warn('Rendering with missing styles:', styleStatus.failed);
    }

    reactRootRef.current.render(children);
  };

  return {
    hostRef,
    areStylesLoaded: styleStatus.completed,
    styleStatus,
    renderWithStyles,
  };
}

export default useExternalStyles;