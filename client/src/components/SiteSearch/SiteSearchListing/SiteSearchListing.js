import React, { useCallback, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import renderHtml from 'utils/renderHtml';
import { InlineMessage, LoadingSpinner, InfiniteScrollTable } from '_common';
import {
  FileNavCell,
  FileLengthCell,
  FileIconCell
} from '../../DataFiles/DataFilesListing/DataFilesListingCells';
import SiteSearchPaginator from './SiteSearchPaginator/SiteSearchPaginator';
import DataFilesPreviewModal from '../../DataFiles/DataFilesModals/DataFilesPreviewModal';
import DataFilesSearchbar from '../../DataFiles/DataFilesSearchbar/DataFilesSearchbar';
import fileTypes from '../../DataFiles/DataFilesSearchbar/FileTypes';
import './SiteSearchListing.module.scss';
import './SiteSearchListing.css';

export const CMSListingItem = ({ title, url, highlight }) => (
  <article styleName="sitesearch-cms-item" data-testid="sitesearch-cms-item">
    <a href={url}>{title}</a>
    {(highlight.body || highlight.title).map(function renderCMSItem(h, i) {
      const key = `${title}-${i}`;

      return <p key={key}> {renderHtml(h)}</p>;
    })}
  </article>
);
CMSListingItem.propTypes = {
  title: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  highlight: PropTypes.shape({
    body: PropTypes.arrayOf(PropTypes.string),
    title: PropTypes.arrayOf(PropTypes.string)
  }).isRequired
};

export const SiteSearchFileListing = ({ listing, filter }) => {
  const fileNavCellCallback = useCallback(
    ({ row }) => {
      return (
        <FileNavCell
          system={row.original.system}
          path={row.original.path}
          name={row.original.name}
          format={row.original.format}
          api="tapis"
          scheme={filter}
          href={row.original._links.self.href}
          isPublic={filter === 'public'}
        />
      );
    },
    [filter]
  );

  const tableColumns = [
    {
      id: 'icon',
      accessor: 'format',
      Cell: FileIconCell,
      className: 'site-search__icons'
    },
    {
      accessor: 'name',
      Cell: fileNavCellCallback,
      className: 'site-search__full-width-result'
    },
    {
      accessor: 'length',
      Cell: FileLengthCell,
      className: 'site-search__no-overflow'
    }
  ];

  return (
    <>
      <InfiniteScrollTable
        tableColumns={tableColumns}
        tableData={listing}
        columnMemoProps={[filter]}
        className="site-search"
      />
    </>
  );
};
SiteSearchFileListing.propTypes = {
  listing: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  filter: PropTypes.string.isRequired
};

const SiteSearchListing = ({ results, loading, error, filter }) => {
  const { listing, count, type } = results;
  const [fileFilterType, setFileFilterType] = useState();
  const [filteredFiles, setFilteredFiles] = useState(listing);
  useEffect(() => {
    const fileFilter = fileTypes.find(f => f.type === fileFilterType);
    if (!fileFilter) {
      setFilteredFiles(listing);
    } else if (fileFilter.type === 'Folders') {
      setFilteredFiles(listing.filter(f => f.format === 'folder'));
    } else {
      setFilteredFiles(
        listing.filter(f =>
          fileFilter.extensions.some(ext => f.name.endsWith(ext))
        )
      );
    }
  }, [fileFilterType, listing]);

  const FILTER_MAPPING = {
    cms: 'Web Content',
    public: 'Public Files',
    community: 'Community Data'
  };

  const hasNoResults = !loading && !error && count === 0;

  let containerStyleNames = `container for-${filter}`;
  if (hasNoResults) containerStyleNames += ' is-empty';

  const lastPageIndex = Math.ceil(count / 10);
  return (
    <div styleName={containerStyleNames}>
      <DataFilesSearchbar
        api="tapis"
        scheme={filter}
        system=""
        filterType={fileFilterType}
        setFilterType={setFileFilterType}
        siteSearch
        disabled={loading || error}
      />
      <h5 styleName="header">{FILTER_MAPPING[filter]}</h5>

      {loading && (
        <div styleName="placeholder">
          <LoadingSpinner />
        </div>
      )}
      {hasNoResults && (
        <div styleName="placeholder">
          <InlineMessage type="info" className="small">
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

      {type === 'cms' &&
        listing.map(item => (
          <CMSListingItem
            key={item.id}
            highlight={item.highlight}
            url={item.url}
            title={item.title}
          />
        ))}

      {type === 'file' && (
        <SiteSearchFileListing listing={filteredFiles} filter={filter} />
      )}

      {count > 0 && (
        <div styleName="paginator-container">
          <SiteSearchPaginator lastPageIndex={lastPageIndex} />
        </div>
      )}
      <DataFilesPreviewModal />
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
