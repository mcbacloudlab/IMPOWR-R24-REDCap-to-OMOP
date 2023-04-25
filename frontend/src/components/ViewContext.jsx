import React, { createContext, useState, useEffect } from 'react';

export const ViewContext = createContext();

export const ViewProvider = ({ children }) => {
  const [view, setView] = useState('My Account');

  useEffect(() => {
    // Store the initial view in the browser history state
    window.history.replaceState({ view: 'My Account' }, '');
    console.log('Initial view set:', 'My Account');

    const handlePopState = (e) => {
      // Update the view based on the browser history state
      if (e.state && e.state.view) {
        console.log('handlePopState: updating view to', e.state.view);
        setView(e.state.view);
      }
    };

    // Listen for the popstate event to handle browser back and forward buttons
    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const changeView = (newView) => {
    // Update the view state and push the new view to the browser history state
    console.log('changeView: changing view to', newView);
    setView(newView);
    window.history.pushState({ view: newView }, '');
  };

  return (
    <ViewContext.Provider value={{ view, setView: changeView }}>
      {children}
    </ViewContext.Provider>
  );
};
