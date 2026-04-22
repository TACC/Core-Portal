import React from 'react';
import useUserNews from 'hooks/news/useUserNews';
import { LoadingSpinner, Pill, Section, SectionTableWrapper } from '_common/index';
import { Link } from 'react-router-dom';
import * as ROUTES from '../../constants/routes';
import styles from './UserNews.module.scss';

const UserNewsBrowse = () => {
  const { data, isPending, isError } = useUserNews({ sanitize: true });

  if (isPending) return <LoadingSpinner />;
  if (isError) return <p className={styles['news-message']}>Unable to load user updates</p>;

  const formatDate = (datestring: string): string => {
    const date = new Date(datestring);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Section
      header="User Updates"
      headerClassName={styles['browse-header']}
      contentShouldScroll
      content={
        <SectionTableWrapper
          contentClassName={styles['browse-news-content']}
          contentShouldScroll
        >
          <div className={styles['news-list']}>
            {data?.length ? (
              data.map((newsItem) => (
                <article className={styles['news-list-item']} key={newsItem.id}>
                  <div className={styles['posted-date']}>
                    Published: {formatDate(newsItem.posted)}
                    {newsItem.updates && newsItem.updates.length > 0 && (
                      <Pill
                        type="warning"
                        className={`${styles['status-pill']} ${styles['status-pill--inline']}`}
                        shouldTruncate={false}
                      >
                        Updated
                      </Pill>
                    )}
                  </div>
                  <div>
                    <h3 className={styles['browse-title']}>
                      <Link
                        to={`${ROUTES.USER_UPDATES}/${newsItem.id}`}
                        className={styles['news-link']}
                      >
                        {newsItem.webtitle.trim()}
                      </Link>
                    </h3>
                    <p className={`${styles['body']} ${styles['body--browse']}`}>{newsItem.content}</p>
                  </div>
                </article>
              ))
            ) : (
              <article className={styles['news-list-item']}>
                <p className={styles['news-message']}>No recent updates found</p>
              </article>
            )}
          </div>
        </SectionTableWrapper>
      }
    />
  );
};

export default UserNewsBrowse;