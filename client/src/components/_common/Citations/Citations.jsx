import React from 'react';
import { useSelector } from 'react-redux';
import styles from './Citations.module.scss';

const usePublisher = () =>
  useSelector((state) => state.workbench.config.publisher);

const DOILink = ({ project }) => {
  const projectUrl = project.doi
    ? `https://www.doi.org/${project.doi}`
    : `DOI link will appear after publication`;

  return project.doi ? (
    <a href={projectUrl} target="_blank" rel="noopener noreferrer">
      {projectUrl}
    </a>
  ) : (
    projectUrl
  );
};

const ACMCitation = ({ project, authors }) => {
  const publisher = usePublisher();
  const authorString = authors
    .map((a) => `${a.first_name} ${a.last_name}`)
    .join(', ');
  const createdDate = new Date(
    project.publication_date || project.created
  ).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div>
      {`${authorString}. ${project.title}. `} <em>{publisher}</em>{' '}
      {` (${createdDate}). `}
      <DOILink project={project} />{' '}
    </div>
  );
};

export const APACitation = ({ project, authors }) => {
  const publisher = usePublisher();
  const authorString = authors
    .map((a) => `${a.last_name}, ${a.first_name.charAt(0)}.`)
    .join(', ');
  const createdDateObj = new Date(project.publication_date || project.created);
  const createdDate = `${createdDateObj.getFullYear()}, ${createdDateObj.toLocaleString(
    'en-US',
    { month: 'long' }
  )} ${createdDateObj.getDate()}`;

  return (
    <div>
      {`${authorString} (${createdDate}). ${project.title} [Dataset]. ${publisher}. `}
      <DOILink project={project} />
    </div>
  );
};

const BibTeXCitation = ({ project, authors }) => {
  const publisher = usePublisher();
  const authorString = authors
    .map((a) => `${a.last_name}, ${a.first_name}`)
    .join(' and ');
  // Use DOI if available, fallback to project URL
  const projectUrl = project.doi
    ? `https://www.doi.org/${project.doi}`
    : `DOI link will appear after publication`;
  const year = new Date(
    project.publication_date || project.created
  ).getFullYear();

  return (
    <pre>{`@misc{dataset,
  author = {${authorString}},
  title = {${project.title}},
  year = {${year}},
  publisher = {${publisher}},
  doi = {},
  howpublished = {\\url{${projectUrl}}}
}`}</pre>
  );
};

export const MLACitation = ({ project, authors }) => {
  const publisher = usePublisher();
  const authorString = authors
    .map((a) => `${a.last_name}, ${a.first_name}`)
    .join(', ');
  const createdDate = new Date(project.publication_date).toLocaleDateString(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }
  );
  const accessDate = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div>
      {`${authorString}. "${project.title}."`} <em>{publisher},</em>{' '}
      {` ${publisher}, ${createdDate}, `}
      <DOILink project={project} />
      {` Accessed ${accessDate}.`}
    </div>
  );
};

const IEEECitation = ({ project, authors }) => {
  const publisher = usePublisher();
  const authorString = authors
    .map((a) => `${a.first_name[0]}. ${a.last_name}`)
    .join(', ');
  const date = new Date(project.publication_date || project.created);
  const year = date.getFullYear();
  const day = date.getDate();
  const month = date.toLocaleString('en-GB', { month: 'short' });

  return (
    <div>
      {`[1] ${authorString}, "${project.title}",`}{' '}
      <em>{publisher},</em>{' '}
      {` ${year}. [Online]. Available: `}
      <DOILink project={project} />
      {`. [Accessed: ${day}-${month}-${year}]`}
    </div>
  );
};

export const Citations = ({ project, authors }) => (
  <div>
    <h3>ACM ref</h3>
    <div className={styles['citation-box']}>
      <ACMCitation project={project} authors={authors} />
    </div>

    <h3>APA</h3>
    <div className={styles['citation-box']}>
      <APACitation project={project} authors={authors} />
    </div>

    <h3>BibTeX</h3>
    <div className={styles['citation-box']}>
      <BibTeXCitation project={project} authors={authors} />
    </div>

    <h3>MLA</h3>
    <div className={styles['citation-box']}>
      <MLACitation project={project} authors={authors} />
    </div>

    <h3>IEEE</h3>
    <div className={styles['citation-box']}>
      <IEEECitation project={project} authors={authors} />
    </div>
  </div>
);

export default Citations;
