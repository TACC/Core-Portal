import PropTypes from 'prop-types';

export const eventPropType = PropTypes.shape({
  time: PropTypes.string,
  message: PropTypes.string
});

export const stepPropType = PropTypes.shape({
  step: PropTypes.string,
  state: PropTypes.string,
  displayName: PropTypes.string,
  description: PropTypes.string,
  userConfirm: PropTypes.string,
  staffApprove: PropTypes.string,
  staffDeny: PropTypes.string,
  customStatus: PropTypes.string,
  events: PropTypes.arrayOf(eventPropType)
});
