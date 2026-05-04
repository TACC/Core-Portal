import React from 'react';
import configureStore from 'redux-mock-store';
import { vi } from 'vitest';
import '@testing-library/jest-dom/extend-expect';
import renderComponent from 'utils/testing';
import * as ROUTES from '../../constants/routes';
import type { UserNewsResponse } from '../../hooks/news';
import UserNewsBrowse from './UserNewsBrowse';
import useUserNews from 'hooks/news/useUserNews';

vi.mock('hooks/news/useUserNews');

const mockStore = configureStore();

const baseNewsItem: UserNewsResponse = {
  id: 201,
  author: 'Test Author',
  title: 'Test title',
  subtitle: '',
  webtitle: 'Browse news title',
  content: 'Browse news body content',
  posted: '2026-02-10T12:30:00',
  postedUTC: '2026-02-10T18:30:00Z',
  downtime: false,
  categoryId: null,
  categories: [],
  updates: [],
};

describe('UserNewsBrowse', () => {
  const store = mockStore({});
  const mockUseUserNews = vi.mocked(useUserNews);

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders a loading spinner', () => {
    mockUseUserNews.mockReturnValue({
      data: [],
      isPending: true,
      isError: false,
      status: 'pending',
    });

    const { getByTestId } = renderComponent(<UserNewsBrowse />, store);
    expect(getByTestId(/loading-spinner/)).toBeInTheDocument();
  });

  it('renders an error message when request fails', () => {
    mockUseUserNews.mockReturnValue({
      data: [],
      isPending: false,
      isError: true,
      status: 'error',
    });

    const { getByText } = renderComponent(<UserNewsBrowse />, store);
    expect(getByText(/Unable to load user updates/i)).toBeInTheDocument();
  });

  it('renders heading, date label, and clickable title link', () => {
    mockUseUserNews.mockReturnValue({
      data: [
        {
          ...baseNewsItem,
          updates: [
            {
              id: 11,
              content: 'Update content',
              posted: '2026-02-11T12:30:00',
              postedUTC: '2026-02-11T18:30:00Z',
            },
          ],
        },
      ],
      isPending: false,
      isError: false,
      status: 'success',
    });

    const { getByText, getByRole } = renderComponent(<UserNewsBrowse />, store);

    expect(getByText(/User Updates/i)).toBeInTheDocument();
    expect(getByText(/Published:/i)).toBeInTheDocument();
    expect(getByText(/^Updated$/i)).toBeInTheDocument();
    expect(getByRole('link', { name: /Browse news title/i })).toHaveAttribute(
      'href',
      `${ROUTES.USER_NEWS}/201`
    );
  });

  it('renders empty state when no updates are available', () => {
    mockUseUserNews.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
      status: 'success',
    });

    const { getByText } = renderComponent(<UserNewsBrowse />, store);
    expect(getByText(/No recent updates found/i)).toBeInTheDocument();
  });
});
