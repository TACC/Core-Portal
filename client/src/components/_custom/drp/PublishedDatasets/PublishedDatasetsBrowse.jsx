import React, { useEffect } from 'react';
import { LoadingSpinner } from '_common';
import { useSelector, useDispatch, shallowEqual } from 'react-redux';
import { Link } from 'react-router-dom';
import * as ROUTES from '../../../../constants/routes';

const BASE_ASSET_URL = 'https://web.corral.tacc.utexas.edu/digitalporousmedia';

function PublishedDatasetsBrowse() {
    const dispatch = useDispatch();

    const { error, loading, publications } = useSelector(
        (state) => state.publications.listing
    );

    const systems = useSelector(
        (state) => state.systems.storage.configuration.filter((s) => !s.hidden),
        shallowEqual
    );

    const selectedSystem = systems.find(
        (s) => s.scheme === 'projects' && s.publicationProject === true
    );

    useEffect(() => {
        dispatch({
            type: 'PUBLICATIONS_GET_PUBLICATIONS',
            payload: {
                system: selectedSystem?.system,
            },
        });
    }, [dispatch]);

    return (
        <div className={'o-section'}>
            <h1>Browse Datasets</h1>
            {loading ? (
                <LoadingSpinner />
            ) : (
            <div className={'c-card-list'}>
                {publications.map((publication) => {

                    const coverImage = publication.cover_image;

                    const thumbnailFile = `${BASE_ASSET_URL}/${coverImage}`;

                    return (
                    <li key={publication.id} className={'c-card--image-top c-card--plain'}>
                        <h3>{publication.title}</h3>
                        <p>
                            <strong>{publication.authors[0].first_name} {publication.authors[0].last_name}</strong>
                        </p>
                        <p>
                            <Link className={'c-button c-button--primary'} to={`${ROUTES.PUBLICATIONS}/${publication.id}`}>View Dataset</Link>
                        </p>
                        <img src={thumbnailFile} alt={publication.title} className={'img-fluid'} />
                    </li>
                )})}
            </div>
            )}
        </div>
    );
}

export default PublishedDatasetsBrowse;
