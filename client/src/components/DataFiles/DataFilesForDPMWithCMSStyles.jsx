import { React } from 'react';

import DataFilesForDPMWithCMSStylesBreadcrumbs from './DataFilesForDPMWithCMSStylesBreadcrumbs';

/* HACK: Temporary; see stylesheet for notes */
import './DataFilesForDPMWithCMSStyles.global.css';

const externalCSS = `
  @layer mimic-cms.base, mimic-cms.project;

  @import url(/static/site_cms/css/build/core-styles.base.css) layer(mimic-cms.base);
  @import url(/static/site_cms/css/build/core-styles.cms.css) layer(mimic-cms.base);
  @import url(/static/site_cms/css/build/core-cms.css) layer(mimic-cms.project);

  @import url(https://cdn.jsdelivr.net/gh/TACC/Core-CMS-Custom@5717c8d/digitalrocks_assets/css/cms.css) layer(mimic-cms);
  @import url(https://cdn.jsdelivr.net/gh/TACC/Core-CMS-Custom@5717c8d/digitalrocks_assets/css/for-core-styles.css) layer(mimic-cms);
`;

const revertCSS = `
  /* To restore relevant behavior of Bootstrap grid */
  .workbench-content .container {
    /* To use padding from Bootstrap 4 (which CMS still uses) */
    --bs-gutter-x: 15px;

    /* To undo Workbench.scss */
    margin-left: revert-layer;
    max-width: revert-layer;
  }

  /* To undo generic Portal styles that do not match CMS */
  body {
    -webkit-font-smoothing: revert;
  }

  /* To adjust Portal styles that mimic old Core Styles */
  .c-button {
    --max-width: auto;
  }
`;

function DataGallery() {
  return (
    <div id="mimic-cms" className="container">
      <DataFilesForDPMWithCMSStylesBreadcrumbs />
      <style dangerouslySetInnerHTML={{ __html: externalCSS }} />
      <style dangerouslySetInnerHTML={{ __html: revertCSS }} />
      <div className="o-section">
        <h1>Browse Datasets</h1>
        <div className="c-card-list">
          <li
            className="c-card--image-top c-card--plain"
            data-tag-change-from="article"
          >
            <h3>11 Sandstones: raw, filtered and segmented data</h3>
            <p>
              <strong>Rodrigo Neumann</strong>
              <br /> IBM Research
            </p>
            <p>
              <a href="/datasets/317/" className="c-button c-button--primary">
                Dataset #317
              </a>
            </p>
            <img
              src="https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/65/10/6510c85e-4f00-4bde-b560-31614fb30ce0/dr-proj-317.png__800.0x764.0_subsampling-2.png"
              alt=""
              srcSet="
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/65/10/6510c85e-4f00-4bde-b560-31614fb30ce0/dr-proj-317.png__576x576_subsampling-2.png 576w,
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/65/10/6510c85e-4f00-4bde-b560-31614fb30ce0/dr-proj-317.png__768x768_subsampling-2.png 768w,
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/65/10/6510c85e-4f00-4bde-b560-31614fb30ce0/dr-proj-317.png__800.0x764.0_subsampling-2.png 800.0w
              "
              sizes="
                  (max-width: 576px) 576px,
                  (max-width: 768px) 768px,
                  800.0px
              "
              className="img-fluid"
            />
          </li>
          <li
            className="c-card--image-top c-card--plain"
            data-tag-change-from="article"
          >
            <h3>
              Bentheimer and Nugget Residual Saturation Micro-Computed Tomography Data
            </h3>
            <p>
              <strong>Laura Dalton</strong>
              <br /> Duke University
            </p>
            <p>
              <a href="/datasets/218/" className="c-button c-button--primary">
                Dataset #218
              </a>
            </p>
            <img
              src="https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/a7/be/a7be0632-6120-4dba-8b2d-b02c1727acac/dr-project-218.png__1104.0x1104.0_q85_subject_location-552%2C552_subsampling-2.jpg"
              alt=""
              srcSet="
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/a7/be/a7be0632-6120-4dba-8b2d-b02c1727acac/dr-project-218.png__576x576_q85_subsampling-2.jpg 576w,
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/a7/be/a7be0632-6120-4dba-8b2d-b02c1727acac/dr-project-218.png__768x768_q85_subsampling-2.jpg 768w,
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/a7/be/a7be0632-6120-4dba-8b2d-b02c1727acac/dr-project-218.png__992x992_q85_subsampling-2.jpg 992w,
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/a7/be/a7be0632-6120-4dba-8b2d-b02c1727acac/dr-project-218.png__1104.0x1104.0_q85_subject_location-552%2C552_subsampling-2.jpg 1104.0w
              "
              sizes="
                  (max-width: 576px) 576px,
                  (max-width: 768px) 768px,
                  (max-width: 992px) 992px,
                  1104.0px
              "
              className="img-fluid"
            />
          </li>
          <li
            className="c-card--image-top c-card--plain"
            data-tag-change-from="article"
          >
            <h3>11 Sandstones: raw, filtered and segmented data</h3>
            <p>
              <strong>Rodrigo Neumann</strong>
              <br /> IBM Research
            </p>
            <p>
              <a href="/datasets/317/" className="c-button c-button--primary">
                Dataset #317
              </a>
            </p>
            <img
              src="https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/65/10/6510c85e-4f00-4bde-b560-31614fb30ce0/dr-proj-317.png__800.0x764.0_subsampling-2.png"
              alt=""
              srcSet="
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/65/10/6510c85e-4f00-4bde-b560-31614fb30ce0/dr-proj-317.png__576x576_subsampling-2.png 576w,
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/65/10/6510c85e-4f00-4bde-b560-31614fb30ce0/dr-proj-317.png__768x768_subsampling-2.png 768w,
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/65/10/6510c85e-4f00-4bde-b560-31614fb30ce0/dr-proj-317.png__800.0x764.0_subsampling-2.png 800.0w
              "
              sizes="
                  (max-width: 576px) 576px,
                  (max-width: 768px) 768px,
                  800.0px
              "
              className="img-fluid"
            />
          </li>
          <li
            className="c-card--image-top c-card--plain"
            data-tag-change-from="article"
          >
            <h3>
              Bentheimer and Nugget Residual Saturation Micro-Computed Tomography Data
            </h3>
            <p>
              <strong>Laura Dalton</strong>
              <br /> Duke University
            </p>
            <p>
              <a href="/datasets/218/" className="c-button c-button--primary">
                Dataset #218
              </a>
            </p>
            <img
              src="https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/a7/be/a7be0632-6120-4dba-8b2d-b02c1727acac/dr-project-218.png__1104.0x1104.0_q85_subject_location-552%2C552_subsampling-2.jpg"
              alt=""
              srcSet="
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/a7/be/a7be0632-6120-4dba-8b2d-b02c1727acac/dr-project-218.png__576x576_q85_subsampling-2.jpg 576w,
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/a7/be/a7be0632-6120-4dba-8b2d-b02c1727acac/dr-project-218.png__768x768_q85_subsampling-2.jpg 768w,
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/a7/be/a7be0632-6120-4dba-8b2d-b02c1727acac/dr-project-218.png__992x992_q85_subsampling-2.jpg 992w,
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/a7/be/a7be0632-6120-4dba-8b2d-b02c1727acac/dr-project-218.png__1104.0x1104.0_q85_subject_location-552%2C552_subsampling-2.jpg 1104.0w
              "
              sizes="
                  (max-width: 576px) 576px,
                  (max-width: 768px) 768px,
                  (max-width: 992px) 992px,
                  1104.0px
              "
              className="img-fluid"
            />
          </li>
          <li
            className="c-card--image-top c-card--plain"
            data-tag-change-from="article"
          >
            <h3>11 Sandstones: raw, filtered and segmented data</h3>
            <p>
              <strong>Rodrigo Neumann</strong>
              <br /> IBM Research
            </p>
            <p>
              <a href="/datasets/317/" className="c-button c-button--primary">
                Dataset #317
              </a>
            </p>
            <img
              src="https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/65/10/6510c85e-4f00-4bde-b560-31614fb30ce0/dr-proj-317.png__800.0x764.0_subsampling-2.png"
              alt=""
              srcSet="
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/65/10/6510c85e-4f00-4bde-b560-31614fb30ce0/dr-proj-317.png__576x576_subsampling-2.png 576w,
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/65/10/6510c85e-4f00-4bde-b560-31614fb30ce0/dr-proj-317.png__768x768_subsampling-2.png 768w,
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/65/10/6510c85e-4f00-4bde-b560-31614fb30ce0/dr-proj-317.png__800.0x764.0_subsampling-2.png 800.0w
              "
              sizes="
                  (max-width: 576px) 576px,
                  (max-width: 768px) 768px,
                  800.0px
              "
              className="img-fluid"
            />
          </li>
          <li
            className="c-card--image-top c-card--plain"
            data-tag-change-from="article"
          >
            <h3>
              Bentheimer and Nugget Residual Saturation Micro-Computed Tomography Data
            </h3>
            <p>
              <strong>Laura Dalton</strong>
              <br /> Duke University
            </p>
            <p>
              <a href="/datasets/218/" className="c-button c-button--primary">
                Dataset #218
              </a>
            </p>
            <img
              src="https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/a7/be/a7be0632-6120-4dba-8b2d-b02c1727acac/dr-project-218.png__1104.0x1104.0_q85_subject_location-552%2C552_subsampling-2.jpg"
              alt=""
              srcSet="
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/a7/be/a7be0632-6120-4dba-8b2d-b02c1727acac/dr-project-218.png__576x576_q85_subsampling-2.jpg 576w,
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/a7/be/a7be0632-6120-4dba-8b2d-b02c1727acac/dr-project-218.png__768x768_q85_subsampling-2.jpg 768w,
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/a7/be/a7be0632-6120-4dba-8b2d-b02c1727acac/dr-project-218.png__992x992_q85_subsampling-2.jpg 992w,
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/a7/be/a7be0632-6120-4dba-8b2d-b02c1727acac/dr-project-218.png__1104.0x1104.0_q85_subject_location-552%2C552_subsampling-2.jpg 1104.0w
              "
              sizes="
                  (max-width: 576px) 576px,
                  (max-width: 768px) 768px,
                  (max-width: 992px) 992px,
                  1104.0px
              "
              className="img-fluid"
            />
          </li>
          <li
            className="c-card--image-top c-card--plain"
            data-tag-change-from="article"
          >
            <h3>11 Sandstones: raw, filtered and segmented data</h3>
            <p>
              <strong>Rodrigo Neumann</strong>
              <br /> IBM Research
            </p>
            <p>
              <a href="/datasets/317/" className="c-button c-button--primary">
                Dataset #317
              </a>
            </p>
            <img
              src="https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/65/10/6510c85e-4f00-4bde-b560-31614fb30ce0/dr-proj-317.png__800.0x764.0_subsampling-2.png"
              alt=""
              srcSet="
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/65/10/6510c85e-4f00-4bde-b560-31614fb30ce0/dr-proj-317.png__576x576_subsampling-2.png 576w,
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/65/10/6510c85e-4f00-4bde-b560-31614fb30ce0/dr-proj-317.png__768x768_subsampling-2.png 768w,
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/65/10/6510c85e-4f00-4bde-b560-31614fb30ce0/dr-proj-317.png__800.0x764.0_subsampling-2.png 800.0w
              "
              sizes="
                  (max-width: 576px) 576px,
                  (max-width: 768px) 768px,
                  800.0px
              "
              className="img-fluid"
            />
          </li>
          <li
            className="c-card--image-top c-card--plain"
            data-tag-change-from="article"
          >
            <h3>
              Bentheimer and Nugget Residual Saturation Micro-Computed Tomography Data
            </h3>
            <p>
              <strong>Laura Dalton</strong>
              <br /> Duke University
            </p>
            <p>
              <a href="/datasets/218/" className="c-button c-button--primary">
                Dataset #218
              </a>
            </p>
            <img
              src="https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/a7/be/a7be0632-6120-4dba-8b2d-b02c1727acac/dr-project-218.png__1104.0x1104.0_q85_subject_location-552%2C552_subsampling-2.jpg"
              alt=""
              srcSet="
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/a7/be/a7be0632-6120-4dba-8b2d-b02c1727acac/dr-project-218.png__576x576_q85_subsampling-2.jpg 576w,
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/a7/be/a7be0632-6120-4dba-8b2d-b02c1727acac/dr-project-218.png__768x768_q85_subsampling-2.jpg 768w,
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/a7/be/a7be0632-6120-4dba-8b2d-b02c1727acac/dr-project-218.png__992x992_q85_subsampling-2.jpg 992w,
                  https://pprd.digitalrocks.tacc.utexas.edu/media/filer_public_thumbnails/filer_public/a7/be/a7be0632-6120-4dba-8b2d-b02c1727acac/dr-project-218.png__1104.0x1104.0_q85_subject_location-552%2C552_subsampling-2.jpg 1104.0w
              "
              sizes="
                  (max-width: 576px) 576px,
                  (max-width: 768px) 768px,
                  (max-width: 992px) 992px,
                  1104.0px
              "
              className="img-fluid"
            />
          </li>
        </div>
        <div className="o-section">
          {/* <!-- FAQ: Bootstrap 4's Pagination pattern --> */}
          <ul className="pagination">
            <li className="page-item disabled">
              <span className="page-link">&lt; Previous</span>
            </li>
            <li className="page-item active">
              <span className="page-link">1</span>
            </li>
            <li className="page-item disabled">
              <span className="page-link">Next &gt;</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default DataGallery;
