import React from 'react';
import configureStore from 'redux-mock-store';
import { vi } from 'vitest';
import '@testing-library/jest-dom/extend-expect';
import renderComponent from 'utils/testing';
import * as ROUTES from '../../constants/routes';
import type { UserNewsResponse } from '../../hooks/news';
import UserNewsDashboard from './UserNewsDashboard';
import useUserNews from 'hooks/news/useUserNews';

vi.mock('hooks/news/useUserNews');

const mockStore = configureStore();

const baseNewsItem: UserNewsResponse = {
  id: 100,
  author: 'Test Author',
  title: 'Test title',
  subtitle: '',
  webtitle: 'Test web title',
  content: 'Test news body content',
  posted: '2026-01-20T11:00:00',
  postedUTC: '2026-01-20T17:00:00Z',
  downtime: false,
  categoryId: null,
  categories: [],
  updates: [],
};

describe('UserNewsDashboard', () => {
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

    const { getByTestId } = renderComponent(<UserNewsDashboard />, store);
    expect(getByTestId(/loading-spinner/)).toBeInTheDocument();
  });

  it('renders an error message when request fails', () => {
    mockUseUserNews.mockReturnValue({
      data: [],
      isPending: false,
      isError: true,
      status: 'error',
    });

    const { getByText } = renderComponent(<UserNewsDashboard />, store);
    expect(getByText(/An error has occurred/)).toBeInTheDocument();
  });

  it('renders at most three items with links and update pill', () => {
    mockUseUserNews.mockReturnValue({
      data: [
        {
          ...baseNewsItem,
          id: 101,
          webtitle: 'News one',
          updates: [
            {
              id: 1,
              content: 'Update content',
              posted: '2026-01-21T11:00:00',
              postedUTC: '2026-01-21T17:00:00Z',
            },
          ],
        },
        { ...baseNewsItem, id: 102, webtitle: 'News two' },
        { ...baseNewsItem, id: 103, webtitle: 'News three' },
        { ...baseNewsItem, id: 104, webtitle: 'News four' },
      ],
      isPending: false,
      isError: false,
      status: 'success',
    });

    const { getAllByText, getByText, getByRole, queryByText } = renderComponent(
      <UserNewsDashboard />,
      store
    );

    expect(getAllByText(/Published:/i)).toHaveLength(3);
    expect(getByText(/^Updated$/i)).toBeInTheDocument();
    expect(getByRole('link', { name: /News one/i })).toHaveAttribute(
      'href',
      `${ROUTES.USER_NEWS}/101`
    );
    expect(queryByText(/News four/i)).toBeNull();
  });
});
