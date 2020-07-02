import React from 'react';
import { string, shape } from 'prop-types';
import { capitalize, isEmpty } from 'lodash';
import AllocationsUsageTable from '../AllocationsUsageTable';
import './AllocationsContactCard.module.scss';

const AllocationsContactCard = ({ listing }) => {
  if (!listing)
    return (
      <span>Click on a user’s name to view their contact information.</span>
    );
  const { firstName, lastName, email, username } = listing;
  return (
    <div styleName="root">
      <div styleName="title">
        {capitalize(firstName)} {capitalize(lastName)} <br />
      </div>
      <div styleName="details">
        Username: {username} | Email: {email}
      </div>
      {!isEmpty(listing.usageData) && (
        <AllocationsUsageTable rawData={listing.usageData} />
      )}
    </div>
  );
};

AllocationsContactCard.propTypes = {
  listing: shape({
    firstName: string.isRequired,
    lastName: string.isRequired,
    email: string.isRequired,
    username: string.isRequired
  })
};
AllocationsContactCard.defaultProps = { listing: {} };

export default AllocationsContactCard;
