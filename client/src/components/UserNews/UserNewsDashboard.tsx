import React from 'react';
import useUserNews from 'hooks/news/useUserNews';
import { LoadingSpinner, Pill, SectionTableWrapper } from '_common';
import { Link } from 'react-router-dom';
import * as ROUTES from '../../constants/routes';
import styles from './UserNews.module.scss';
import { formatUserNewsDate } from 'utils/timeFormat';

const NEWS_DASHBOARD_DISPLAY_LIMIT = 3;

const UserNewsDashboard = () => {
  const { data, isPending, isError, status } = useUserNews({ sanitize: true });

  if (isPending) {
    return <LoadingSpinner placement="inline" />;
  }

  if (isError) {
    return <div className={styles['news-message']}>An error has occurred</div>;
  }

  return (
    <div className={styles['news-list']}>
      {data &&
        data.length > 0 &&
        data.slice(0, NEWS_DASHBOARD_DISPLAY_LIMIT).map((newsItem) => (
          <article className={styles['news-list-item']} key={newsItem.id}>
            <div className={styles['posted-date']}>
              Published: {formatUserNewsDate(newsItem.posted)}
              {newsItem.updates && newsItem.updates.length > 0 && (
                <Pill
                  type="warning"
                  className={`${styles['status-pill']} ${styles['status-pill--inline']}`}
                >
                  Updated
                </Pill>
              )}
            </div>
            <h3 className={styles['title']}>
              <Link
                to={`${ROUTES.USER_NEWS}/${newsItem.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles['news-link']}
              >
                {newsItem.webtitle.trim()}
              </Link>
            </h3>
            <p className={`${styles['body']} ${styles['body--dashboard']}`}>
              {newsItem.content}
            </p>
          </article>
        ))}
    </div>
  );
};

export default UserNewsDashboard;
