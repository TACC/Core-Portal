import { useEffect, useRef, useState, useLayoutEffect } from 'react';
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

  function initializeShadowRoot() {
    if (!hostRef.current) {
      console.warn('No hostRef.current found');
      return null;
    }

    if (!shadowRootRef.current) {
      try {
        shadowRootRef.current = hostRef.current.shadowRoot || 
          hostRef.current.attachShadow({ mode: 'open' });
      } catch (error) {
        console.error('Failed to create shadow root:', error);
        return null;
      }
    }

    return shadowRootRef.current;
  }

  function cleanupDOM() {
    if (shadowRootRef.current) {
      const container = shadowRootRef.current.querySelector('div');
      if (container) container.remove();
      const links = shadowRootRef.current.querySelectorAll('link');
      links.forEach(link => link.remove());
    }
  }

  function cleanupReact() {
    if (reactRootRef.current) {
      reactRootRef.current.unmount();
      reactRootRef.current = null;
    }
    
    setStyleStatus({
      loaded: [],
      failed: [],
      completed: false
    });
  }

  useLayoutEffect(() => {
    return cleanupDOM;
  }, []);

  useEffect(() => {
    const shadowRoot = initializeShadowRoot();
    if (!shadowRoot) return;

    loadStylesheets(shadowRoot);

    return cleanupReact;
  }, [externalStylesheets]);

  function loadStylesheets(shadowRoot) {
    const totalStylesheets = externalStylesheets.length;
    if (totalStylesheets === 0) {
      setStyleStatus({ loaded: [], failed: [], completed: true });
      return;
    }

    const existingLinks = shadowRoot.querySelectorAll('link');
    existingLinks.forEach(link => link.remove());

    const loaded = [];
    const failed = [];

    function checkAllComplete() {
      if (loaded.length + failed.length === totalStylesheets) {
        setStyleStatus({
          loaded,
          failed,
          completed: true
        });
        if (failed.length > 0) {
          console.warn('Some stylesheets failed to load:', failed);
        }
      }
    }

    externalStylesheets.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = () => {
        loaded.push(url);
        checkAllComplete();
      };
      link.onerror = () => {
        failed.push(url);
        checkAllComplete();
      };
      shadowRoot.appendChild(link);
    });
  }

  function renderWithStyles(children) {
    const shadowRoot = shadowRootRef.current;
    if (!shadowRoot) {
      console.warn('Cannot render: no shadow root');
      return;
    }

    if (!reactRootRef.current) {
      const container = document.createElement('div');
      shadowRoot.appendChild(container);
      reactRootRef.current = createRoot(container);
    }

    reactRootRef.current.render(children);
  }


  return {
    hostRef,
    areStylesLoaded: styleStatus.completed,
    styleStatus,
    renderWithStyles,
  };
}

export default useExternalStyles;