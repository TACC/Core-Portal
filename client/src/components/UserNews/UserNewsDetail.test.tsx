import React from 'react';
import configureStore from 'redux-mock-store';
import { vi } from 'vitest';
import '@testing-library/jest-dom/extend-expect';
import renderComponent from 'utils/testing';
import * as ROUTES from '../../constants/routes';
import type { UserNewsResponse } from '../../hooks/news';
import UserNewsDetail from './UserNewsDetail';
import useUserNews from 'hooks/news/useUserNews';

let mockRouteId = '301';

vi.mock('hooks/news/useUserNews');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>(
    'react-router-dom'
  );
  return {
    ...actual,
    useParams: () => ({
      id: mockRouteId,
    }),
  };
});

const mockStore = configureStore();

const baseNewsItem: UserNewsResponse = {
  id: 301,
  author: 'Test Author',
  title: 'Test title',
  subtitle: '',
  webtitle: 'Detail news title',
  content: '<p>Original body content</p>',
  posted: '2026-03-15T09:00:00',
  postedUTC: '2026-03-15T15:00:00Z',
  downtime: false,
  categoryId: null,
  categories: [],
  updates: [],
};

describe('UserNewsDetail', () => {
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

    const { getByTestId } = renderComponent(<UserNewsDetail />, store);
    expect(getByTestId(/loading-spinner/)).toBeInTheDocument();
  });

  it('renders an error message when request fails', () => {
    mockUseUserNews.mockReturnValue({
      data: [],
      isPending: false,
      isError: true,
      status: 'error',
    });

    const { getByText } = renderComponent(<UserNewsDetail />, store);
    expect(getByText(/Unable to load user updates/i)).toBeInTheDocument();
  });

  it('renders not found state with back link', () => {
    mockRouteId = '999';
    mockUseUserNews.mockReturnValue({
      data: [{ ...baseNewsItem }],
      isPending: false,
      isError: false,
      status: 'success',
    });

    const { getByText, getByRole } = renderComponent(<UserNewsDetail />, store);

    expect(getByText(/Update not found/i)).toBeInTheDocument();
    expect(getByRole('link', { name: /Back to all updates/i })).toHaveAttribute(
      'href',
      ROUTES.USER_UPDATES
    );
  });

  it('renders selected detail timeline and passes sanitize false', () => {
    mockRouteId = '301';
    mockUseUserNews.mockReturnValue({
      data: [
        {
          ...baseNewsItem,
          updates: [
            {
              id: 991,
              content: '<p>Updated content</p>',
              posted: '2026-03-16T09:00:00',
              postedUTC: '2026-03-16T15:00:00Z',
            },
          ],
        },
      ],
      isPending: false,
      isError: false,
      status: 'success',
    } as UseUserNewsReturn);

    const { getByText } = renderComponent(<UserNewsDetail />, store);

    expect(mockUseUserNews).toHaveBeenCalledWith({ sanitize: false });
    expect(getByText(/Detail news title/i)).toBeInTheDocument();
    expect(getByText(/^Updated$/i)).toBeInTheDocument();
    expect(getByText(/Original Message/i)).toBeInTheDocument();
    expect(getByText(/Updated content/i)).toBeInTheDocument();
    expect(getByText(/Original body content/i)).toBeInTheDocument();
  });
});
