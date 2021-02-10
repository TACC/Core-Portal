import React from 'react';
import { InfiniteScrollTable } from '_common';
import { v4 as uuidv4 } from 'uuid';
import './OnboardingAdminList.scss';
import './OnboardingAdminList.module.scss';

const OnboardingAdminList = ({ users }) => {
  const columns = [
    {
      Header: (
        <>
          User
          <button>Sort</button>
        </>
      ),
      accessor: 'lastName',
      Cell: el => (
        <span>
          {`${el.row.original.firstName} ${el.row.original.lastName}`}
        </span>
      )
    },
    {
      Header: 'Step',
      accessor: 'steps',
      Cell: el => (
        <table styleName="cell-table">
          {el.value.map(step => (
            <tr>
              <td>{step.displayName}</td>
            </tr>
          ))}
        </table>
      )
    }
  ];

  return (
    <InfiniteScrollTable
      tableData={users}
      tableColumns={columns}
      className="onboarding-admin-list"
    />
  );
};

export default OnboardingAdminList;
