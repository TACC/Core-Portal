import React from 'react';
import { string, shape, arrayOf } from 'prop-types';
import { capitalize } from 'lodash';
import { DescriptionList } from '_common';
import AllocationsUsageTable from '../AllocationsUsageTable';
import styles from './AllocationsContactCard.module.scss';

const AllocationsContactCard = ({ listing }) => {
  if (!listing)
    return <span>Click on a user’s name to view their allocation usage.</span>;
  const { firstName, lastName, email, username } = listing;

  return (
    <div className={styles.root}>
      <div className={styles.title}>
        {capitalize(firstName)} {capitalize(lastName)}
      </div>
      <DescriptionList
        className={styles.details}
        data={{
          Username: username,
          Email: email,
        }}
        direction="horizontal"
        density="compact"
      />
      <AllocationsUsageTable rawData={listing.usageData} />
    </div>
  );
};

AllocationsContactCard.propTypes = {
  listing: shape({
    firstName: string.isRequired,
    lastName: string.isRequired,
    email: string.isRequired,
    username: string.isRequired,
    usageData: arrayOf(shape({})).isRequired,
  }),
};
AllocationsContactCard.defaultProps = { listing: {} };

export default AllocationsContactCard;
