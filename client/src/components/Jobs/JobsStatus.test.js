import React from 'react';
import { render } from '@testing-library/react';
import JobsStatus, { getStatusText, getBadgeColor } from './JobsStatus';
import { toHaveClass } from '@testing-library/jest-dom/dist/matchers';


expect.extend({ toHaveClass });
describe('JobsStatus', () => {
  it('converts status to proper UI strings', () => {
    expect(getStatusText('ACCEPTED')).toEqual('Processing');
    expect(getStatusText('PENDING')).toEqual('Processing');
    expect(getStatusText('PROCESSING_INPUTS')).toEqual('Processing');
    expect(getStatusText('STAGING_INPUTS')).toEqual('Staging');
    expect(getStatusText('STAGED')).toEqual('Staging');
    expect(getStatusText('STAGING_JOB')).toEqual('Staging');
    expect(getStatusText('SUBMITTING')).toEqual('Submitted');
    expect(getStatusText('QUEUED')).toEqual('Queued');
    expect(getStatusText('RUNNING')).toEqual('Running');
    expect(getStatusText('CLEANING_UP')).toEqual('Running');
    expect(getStatusText('ARCHIVING')).toEqual('Running');
    expect(getStatusText('FINISHED')).toEqual('Finished');
    expect(getStatusText('STOPPED')).toEqual('Stopped');
    expect(getStatusText('FAILED')).toEqual('Failure');
    expect(getStatusText('BLOCKED')).toEqual('Blocked');
    expect(getStatusText('PAUSED')).toEqual('Paused');
    expect(getStatusText('random_status')).toEqual('random_status');
  });

  it('gets badge color for job status', () => {
    expect(getBadgeColor('FAILED')).toEqual('danger');
    expect(getBadgeColor('FINISHED')).toEqual('success');
    expect(getBadgeColor('STOPPED')).toEqual('warning');
    expect(getBadgeColor('BLOCKED')).toEqual('warning');
    expect(getBadgeColor('RUNNING')).toEqual(null);
  });

  it('renders Finished', () => {
    const { getByText } = render(<JobsStatus status={"FINISHED"} fancy={false}/>);
    expect(getByText(/Finished/)).toBeDefined();
  });

  it('renders Finished with success badge', () => {
    const { getByText } = render(<JobsStatus status={"FINISHED"} fancy/>);
    expect(getByText(/Finished/)).toBeDefined();
    expect(getByText(/Finished/)).toHaveClass('badge badge-success');
  });

});