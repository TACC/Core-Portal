import React from 'react';

export default function DataFilesForDPMViews({
  tabs,
  view,
  setView,
  navClassName,
  contentClassName,
}) {
  return (
    <>
      <ul className={`nav nav-tabs ${navClassName}`} id="tabs" role="tablist">
        {tabs.map((tab) => (
          <li className="nav-item" key={tab.view} role="presentation">
            <a
              className={`nav-link${view === tab.view ? ' active' : ''}`}
              id={tab.id}
              data-toggle="tab"
              href={`#${tab.contentId}`}
              role="tab"
              aria-controls={tab.contentId}
              aria-selected={view === tab.view}
              tabIndex={view === tab.view ? 0 : -1}
              onClick={(e) => {
                e.preventDefault();
                setView(tab.view);
              }}
            >
              {tab.label}
            </a>
          </li>
        ))}
      </ul>
      <div id="tabs-content" className={`tab-content ${contentClassName}`}>
        {tabs.map((tab) => {
          const TabContent = tab.Content;
          return (
            <div
              key={tab.view}
              className={`tab-pane ${view === tab.view ? 'active' : ''}`}
              id={tab.contentId}
              role="tabpanel"
              aria-labelledby={tab.id}
            >
              {view === tab.view ? <TabContent /> : null}
            </div>
          );
        })}
      </div>
    </>
  );
}
