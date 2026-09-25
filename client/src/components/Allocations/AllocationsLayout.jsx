import React from 'react';
import { useSelector } from 'react-redux';
import { Link, Route, Routes, Navigate, useNavigate } from 'react-router-dom';
import { string } from 'prop-types';
import { LoadingSpinner, Section, SectionTableWrapper } from '_common';
import { AllocationsTable } from './AllocationsTables';
import { AllocationsTeamViewModal } from './AllocationsModals';
import * as ROUTES from '../../constants/routes';
import { Sidebar } from '_common';

import './Allocations.global.css';

export const Header = ({ page }) => {
  return (
    <>
      <Link to={`${ROUTES.WORKBENCH}${ROUTES.ALLOCATIONS}`}>Allocations</Link>
      <span>&nbsp;/&nbsp;</span>
      <span>{page[0].toUpperCase() + page.substring(1)}</span>
    </>
  );
};
Header.propTypes = { page: string.isRequired };

export const Actions = () => {
  return (
    <a
      className="btn btn-primary"
      href="https://submit-tacc.xras.org/"
      target="_blank"
      rel="noreferrer"
    >
      Request New Allocation
    </a>
  );
};

export const Layout = ({ page }) => {
  const loading = useSelector((state) => state.allocations.loading);
  const navigate = useNavigate();
  const root = `${ROUTES.WORKBENCH}${ROUTES.ALLOCATIONS}`;

  const sidebarItems = [
    {
      to: `${root}/approved`,
      label: 'Approved',
      iconName: 'approved-allocations',
      disabled: false,
      hidden: false,
    },
    {
      to: `${root}/expired`,
      label: 'Expired',
      iconName: 'pending',
      disabled: false,
      hidden: false,
    },
  ];

  return (
    <Section
      bodyClassName="has-loaded-allocations"
      messageComponentName="ALLOCATIONS"
      header={<Header page={page} />}
      headerClassName="allocations-header"
      headerActions={<Actions page={page} />}
      content={
        <>
          <Sidebar sidebarItems={sidebarItems} />
          {loading ? (
            <LoadingSpinner className="allocations-loading-icon" />
          ) : (
            <SectionTableWrapper
              className="allocations-content"
              contentShouldScroll
            >
              <AllocationsTable page={page} />
            </SectionTableWrapper>
          )}
          <Routes>
            <Route
              path={`${page}/:projectId`}
              element={
                <AllocationsTeamViewModal
                  isOpen
                  toggle={() => {
                    navigate(`${root}/${page}`);
                  }}
                />
              }
            />
            <Route
              path="*"
              element={<Navigate to={`${root}/${page}`} replace />}
            />
          </Routes>
        </>
      }
    />
  );
};
Layout.propTypes = {
  page: string.isRequired,
};
