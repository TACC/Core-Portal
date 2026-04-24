import React from 'react';
import { Link, useParams } from 'react-router-dom';
import useUserNews from 'hooks/news/useUserNews';
import { LoadingSpinner, Pill, Section, SectionTableWrapper } from '_common';
import * as ROUTES from '../../constants/routes';
import renderHtml from 'utils/renderHtml';
import { formatUserNewsDate } from 'utils/timeFormat';
import styles from './UserNews.module.scss';

const UserNewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data, isPending, isError } = useUserNews({ sanitize: false });

  if (isPending) return <LoadingSpinner />;
  if (isError) return <p className={styles['news-message']}>Unable to load user updates</p>;

  const selectedNews = data.find((newsItem) => String(newsItem.id) === id);

  if (!selectedNews) {
    return (
      <>
        <div className={styles['detail-top-back-link-wrapper']}>
          <Link to={ROUTES.USER_UPDATES} className={styles['news-link']}>
            Back to all updates
          </Link>
        </div>
        <Section
          contentShouldScroll
          content={
            <SectionTableWrapper contentClassName={styles['detail-news-content']} contentShouldScroll>
              <p className={styles['news-message']}>Update not found</p>
            </SectionTableWrapper>
          }
        />
      </>
    );
  }

  const timelineEntries = [
    ...selectedNews.updates.map((update) => ({
      id: `update-${update.id}`,
      content: update.content,
      posted: update.posted,
      isMainContent: false,
    })),
    {
      id: `main-${selectedNews.id}`,
      content: selectedNews.content,
      posted: selectedNews.posted,
      isMainContent: true,
    },
  ].sort(
    (entryA, entryB) => new Date(entryB.posted).getTime() - new Date(entryA.posted).getTime()
  );
  const hasUpdates = selectedNews.updates.length > 0;

  return (
    <>
      <div className={styles['detail-top-back-link-wrapper']}>
        <Link to={ROUTES.USER_UPDATES} className={styles['news-link']}>
          Back to all updates
        </Link>
      </div>
      <Section
        contentShouldScroll
        content={
          <SectionTableWrapper contentClassName={styles['detail-news-content']} contentShouldScroll>
            <article className={`${styles['detail-news-list-item']} ${styles['detail-title-row']}`}>
              <h2 className={styles['detail-title']}>{selectedNews.webtitle.trim()}</h2>
            </article>

            <div>
              {timelineEntries.map((entry) => (
                <article key={entry.id} className={styles['detail-news-list-item']}>
                  {(!entry.isMainContent || hasUpdates) && (
                    <Pill
                      type={entry.isMainContent ? 'normal' : 'warning'}
                      className={styles['status-pill']}
                      shouldTruncate={false}
                    >
                      {entry.isMainContent ? 'Original Message' : 'Updated'}
                    </Pill>
                  )}
                  <span
                    className={`${styles['posted-date']} ${styles['posted-date--detail']} ${
                      !entry.isMainContent || hasUpdates ? styles['posted-date--inline'] : ''
                    }`}
                  >
                    Published {formatUserNewsDate(entry.posted)}
                  </span>
                  <div className={`${styles['body']} ${styles['body--detail']}`}>
                    {renderHtml(entry.content)}
                  </div>
                </article>
              ))}
            </div>
          </SectionTableWrapper>
        }
      />
    </>
  );
};

export default UserNewsDetail;
