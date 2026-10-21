import React, { useEffect, useMemo, useState } from 'react';
import { LoadingSpinner } from '_common';
import Searchbar from '_common/Searchbar';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { Link } from 'react-router-dom';
import * as ROUTES from '../../../../constants/routes';
import queryStringParser from 'query-string';
import { useLocation } from 'react-router-dom';

import styles from './PublishedDatasetsBrowse.module.css';
import { useWorkbenchConfig } from '@tacc/core-hooks';

const BASE_ASSET_URL = 'https://web.corral.tacc.utexas.edu/digitalporousmedia';

function PublishedDatasetsBrowse() {
  const dispatch = useDispatch();

  const {
    data: {
      config: { debug: isDebug },
    },
  } = useWorkbenchConfig();

  const query = queryStringParser.parse(useLocation().search);

  const { loading, publications } = useSelector(
    (state) => state.publications.listing
  );

  const systems = useSelector(
    (state) => state.systems.storage.configuration.filter((s) => !s.hidden),
    shallowEqual
  );

  const selectedSystemId = systems.find(
    (s) => s.scheme === 'projects' && s.publicationProject === true
  )?.system;

  useEffect(() => {
    dispatch({
      type: 'PUBLICATIONS_GET_PUBLICATIONS',
      payload: {
        queryString: query.query_string,
        system: selectedSystemId,
      },
    });
  }, [dispatch, query.query_string, selectedSystemId]);

  // A first publish that's still in progress isn't listed, matching the
  // sitemap and the server-rendered catalog.
  const listedPublications = useMemo(
    () => (publications || []).filter((pub) => pub.is_indexable !== false),
    [publications]
  );

  // Workaround to filter out publications that don't have a cover image
  // Mainly done so we can test pprd properly. Holds the publications whose
  // image loaded and the list they were checked from, so a result for an
  // older list is never shown.
  const [validated, setValidated] = useState({ source: null, results: [] });

  // Only perform image validation in pprd and dev environment
  useEffect(() => {
    if (!isDebug) return;
    let cancelled = false;
    Promise.all(
      listedPublications.map((pub) => {
        return new Promise((resolve) => {
          if (
            !pub.cover_image ||
            pub.cover_image.includes(
              'media/default/cover_image/default_logo.png'
            )
          ) {
            return resolve(null);
          }

          const img = new Image();
          img.onload = () => resolve(pub);
          img.onerror = () => resolve(null);
          img.src = `${BASE_ASSET_URL}/${pub.cover_image}`;
        });
      })
    )
      .then((results) => {
        if (!cancelled) {
          setValidated({
            source: listedPublications,
            results: results.filter(Boolean),
          });
        }
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) {
          setValidated({ source: listedPublications, results: [] });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isDebug, listedPublications]);

  const filteredPublicationsLoading =
    isDebug && validated.source !== listedPublications;
  // In production, use all publications without validation
  let filteredPublications = listedPublications;
  if (isDebug) {
    filteredPublications = filteredPublicationsLoading ? [] : validated.results;
  }

  return (
    <div className={'o-section'}>
      <header className={'header'}>
        <h1>Browse Datasets</h1>
        <Searchbar
          api="tapis"
          scheme="projects"
          sectionName="Datasets"
          resultCount={filteredPublications.length}
          className={`header__action ${styles['searchbar']}`}
          disabled={loading || filteredPublicationsLoading}
        />
      </header>
      {loading || filteredPublicationsLoading ? (
        <LoadingSpinner />
      ) : (
        filteredPublications.length > 0 && (
          <div className={'c-card-list'}>
            {filteredPublications.map((publication) => {
              const coverImage = publication.cover_image;

              const thumbnailFile = `${BASE_ASSET_URL}/${coverImage}`;

              return (
                <li
                  key={publication.id}
                  className={'c-card--image-top c-card--plain'}
                >
                  <h3>{publication.title}</h3>
                  <p>
                    <strong>
                      {publication.authors[0].first_name}{' '}
                      {publication.authors[0].last_name}
                    </strong>
                  </p>
                  <p>
                    <Link
                      className={'c-button c-button--primary'}
                      to={`${ROUTES.PUBLICATIONS}/${publication.id}`}
                    >
                      View Dataset
                    </Link>
                  </p>
                  <img
                    src={thumbnailFile}
                    alt={publication.title}
                    className={'img-fluid'}
                  />
                </li>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

export default PublishedDatasetsBrowse;
