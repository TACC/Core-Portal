import React from 'react';
import PropTypes from 'prop-types';
import { InlineMessage, LoadingSpinner } from '_common';
import renderHtml from 'utils/renderHtml';
import SiteSearchSearchbar from './SiteSearchSearchbar/SiteSearchSearchbar';
import SiteSearchPaginator from './SiteSearchPaginator/SiteSearchPaginator';
import './SiteSearchListing.module.scss';

export const CMSListingItem = ({ title, url, highlight }) => (
  <div styleName="sitesearch-cms-item" data-testid="sitesearch-cms-item">
    <div>
      <a href={url} styleName="wb-link">
        <b>{title}</b>
      </a>
    </div>
    {/* eslint-disable react/no-array-index-key */}
    {(highlight.body || highlight.title).map((h, i) => (
      <div key={i}> {renderHtml(h)}</div>
    ))}
    {/* eslint-disable react/no-array-index-key */}
  </div>
);
CMSListingItem.propTypes = {
  title: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  highlight: PropTypes.shape({
    body: PropTypes.arrayOf(PropTypes.string),
    title: PropTypes.arrayOf(PropTypes.string)
  }).isRequired
};

export const FileListingItem = ({ name, size, lastModified, path }) => (
  <div styleName="sitesearch-cms-item">
    <h5>{name}</h5>
    <div>{path}</div>
  </div>
);
FileListingItem.propTypes = {
  name: PropTypes.string.isRequired,
  size: PropTypes.number.isRequired,
  lastModified: PropTypes.string.isRequired,
  path: PropTypes.string.isRequired
};

const SiteSearchListing = ({ results, loading, error, filter }) => {
  const FILTER_MAPPING = {
    cms: 'Web Content',
    public: 'Public Files',
    community: 'Community Data'
  };
  const lastPageIndex = Math.ceil(results.count / 10);
  return (
    <div styleName="container">
      <div>
        <SiteSearchSearchbar />
      </div>
      <div styleName="header">
        <h5>{FILTER_MAPPING[filter]}</h5>
      </div>

      {loading && (
        <div styleName="placeholder">
          <LoadingSpinner />
        </div>
      )}
      {!loading && !error && results.count === 0 && (
        <div styleName="placeholder">
          <InlineMessage type="warning">
            No results found in {FILTER_MAPPING[filter]}.
          </InlineMessage>
        </div>
      )}
      {error && (
        <div styleName="placeholder">
          <InlineMessage type="error">
            There was an error retrieving your search results.
          </InlineMessage>
        </div>
      )}

      {results.type === 'cms' &&
        results.listing.map(item => (
          <CMSListingItem
            key={item.id}
            highlight={item.highlight}
            url={item.url}
            title={item.title}
          />
        ))}

      {results.type === 'file' &&
        results.listing.map(item => (
          <FileListingItem
            key={`${item.system}_${item.path}`}
            name={item.name}
            size={item.length}
            lastModified={item.lastModified}
            path={item.path}
          />
        ))}

      {results.count > 0 && (
        <div styleName="paginator-container">
          <SiteSearchPaginator lastPageIndex={lastPageIndex} />
        </div>
      )}
    </div>
  );
};
SiteSearchListing.propTypes = {
  results: PropTypes.shape({
    count: PropTypes.number,
    type: PropTypes.string,
    listing: PropTypes.arrayOf(PropTypes.shape({}))
  }).isRequired,
  error: PropTypes.shape({
    status: PropTypes.number,
    message: PropTypes.string
  }),
  loading: PropTypes.bool.isRequired,
  filter: PropTypes.string.isRequired
};
SiteSearchListing.defaultProps = {
  error: null
};

export default SiteSearchListing;
