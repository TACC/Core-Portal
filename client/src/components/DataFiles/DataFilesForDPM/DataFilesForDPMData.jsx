import React from 'react';

import style from './DataFilesForDPM.module.css';

// TODO: Replace use of this with component(s) from WC-219
export default function DataFilesForDPMData() {
  return (
    <>
      <section className="o-section">
        <h3 className="u-title-needs-colon">
          <span>Origin Data</span> <strong>Berea_2d25um_grayscale.raw</strong>
        </h3>

        <p>
          Grayscale image data obtained by using high-resolution 3D X-ray
          Microtomography. Source voltage and current were set to 50 kV and 200
          µA, respectively. The CCD camera was configured to acquire projections
          of 4904 x 3280 pixels, resulting in a pixel side length of 2.25 µm.
          For more details, please refer to the related publications.
        </p>

        <table className="c-data-list c-data-list--horizontal c-data-list--is-narrow">
          <tbody>
            <tr>
              <th className="c-data-list__key">Segmented</th>
              <td className="c-data-list__value">No</td>
            </tr>
            <tr>
              <th className="c-data-list__key">Voxel length (x, y, z)</th>
              <td className="c-data-list__value">2.25, 2.25, 2.25 um</td>
            </tr>
            <tr>
              <th className="c-data-list__key">Sample</th>
              <td className="c-data-list__value">
                <a href="/datasets/317#sample-berea">Berea</a>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section id="data" className="o-section">
        <h3>Data</h3>

        <ul className="c-card-list" data-tag-change-from="div">
          <li
            className="c-card--image-top c-card--plain"
            data-tag-change-from="article"
          >
            <img
              src="/media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__1000.0x1000.0_q85_subsampling-2.jpg"
              alt=""
              srcSet="
            
                /media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__576x576_q85_subsampling-2.jpg 576w,
            
                /media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__768x768_q85_subsampling-2.jpg 768w,
            
                /media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__992x992_q85_subsampling-2.jpg 992w,
            
            /media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__1000.0x1000.0_q85_subsampling-2.jpg 1000.0w
        "
              sizes="
            
                (max-width: 576px) 576px,
            
                (max-width: 768px) 768px,
            
                (max-width: 992px) 992px,
            
            1000.0px
        "
              className="img-fluid"
            />

            <p>
              <strong>Berea_2d25um_grayscale.raw</strong>
              <br />
              953.7 MB
            </p>

            <table className="c-data-list c-data-list--is-vert c-data-list--is-narrow c-data-list--should-truncate-values">
              <tbody>
                <tr>
                  <th className="c-data-list__key">Image Type</th>
                  <td className="c-data-list__value">8-bit</td>
                </tr>
                <tr>
                  <th className="c-data-list__key">Width</th>
                  <td className="c-data-list__value">1000</td>
                </tr>
                <tr>
                  <th className="c-data-list__key">Height</th>
                  <td className="c-data-list__value">1000</td>
                </tr>
                <tr>
                  <th className="c-data-list__key">Number of Slices</th>
                  <td className="c-data-list__value">1000</td>
                </tr>
                <tr className="c-data-list__row--start-final">
                  <th className="c-data-list__key">Byte Order</th>
                  <td className="c-data-list__value">little-endian</td>
                </tr>
              </tbody>
            </table>

            <p className="dropdown" data-tag-change-from="div">
              <button
                className="dropdown-toggle  c-button c-button--primary"
                data-toggle="dropdown"
                type="button"
              >
                Action
              </button>
              <menu className="dropdown-menu">
                <li>
                  <a
                    className="dropdown-item"
                    href="/datasets/317/images/223451/download/"
                    target="_blank"
                  >
                    Download File{' '}
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/media/projects/317/origin/1352/images/Berea_2d25um_grayscale.raw.gif"
                    target="_blank"
                  >
                    View GIF
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/media/projects/317/origin/1352/images/Berea_2d25um_grayscale.raw.histogram.jpg"
                    target="_blank"
                  >
                    Histogram
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/media/projects/317/origin/1352/images/Berea_2d25um_grayscale.raw.histogram.csv"
                    target="_blank"
                  >
                    Histogram (CSV)
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/datasets/317/images/223451/downloadMeta/"
                    target="_blank"
                  >
                    Metadata
                  </a>
                </li>
                <li className="dropdown-divider"></li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/datasets/paraview_info/223451/"
                    target="_blank"
                  >
                    View in Paraview
                  </a>
                </li>
              </menu>
            </p>
          </li>
          <li
            className="c-card--image-top c-card--plain"
            data-tag-change-from="article"
          >
            <img
              src="/media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__1000.0x1000.0_q85_subsampling-2.jpg"
              alt=""
              srcSet="
            
                /media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__576x576_q85_subsampling-2.jpg 576w,
            
                /media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__768x768_q85_subsampling-2.jpg 768w,
            
                /media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__992x992_q85_subsampling-2.jpg 992w,
            
            /media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__1000.0x1000.0_q85_subsampling-2.jpg 1000.0w
        "
              sizes="
            
                (max-width: 576px) 576px,
            
                (max-width: 768px) 768px,
            
                (max-width: 992px) 992px,
            
            1000.0px
        "
              className="img-fluid"
            />

            <p>
              <strong>Berea_2d25um_grayscale.raw</strong>
              <br />
              953.7 MB
            </p>

            <table className="c-data-list c-data-list--is-vert c-data-list--is-narrow c-data-list--should-truncate-values">
              <tbody>
                <tr>
                  <th className="c-data-list__key">Image Type</th>
                  <td className="c-data-list__value">8-bit</td>
                </tr>
                <tr>
                  <th className="c-data-list__key">Width</th>
                  <td className="c-data-list__value">1000</td>
                </tr>
                <tr>
                  <th className="c-data-list__key">Height</th>
                  <td className="c-data-list__value">1000</td>
                </tr>
                <tr>
                  <th className="c-data-list__key">Number of Slices</th>
                  <td className="c-data-list__value">1000</td>
                </tr>
                <tr className="c-data-list__row--start-final">
                  <th className="c-data-list__key">Byte Order</th>
                  <td className="c-data-list__value">little-endian</td>
                </tr>
              </tbody>
            </table>

            <p className="dropdown" data-tag-change-from="div">
              <button
                className="dropdown-toggle  c-button c-button--primary"
                data-toggle="dropdown"
                type="button"
              >
                Action
              </button>
              <menu className="dropdown-menu">
                <li>
                  <a
                    className="dropdown-item"
                    href="/datasets/317/images/223451/download/"
                    target="_blank"
                  >
                    Download File{' '}
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/media/projects/317/origin/1352/images/Berea_2d25um_grayscale.raw.gif"
                    target="_blank"
                  >
                    View GIF
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/media/projects/317/origin/1352/images/Berea_2d25um_grayscale.raw.histogram.jpg"
                    target="_blank"
                  >
                    Histogram
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/media/projects/317/origin/1352/images/Berea_2d25um_grayscale.raw.histogram.csv"
                    target="_blank"
                  >
                    Histogram (CSV)
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/datasets/317/images/223451/downloadMeta/"
                    target="_blank"
                  >
                    Metadata
                  </a>
                </li>
                <li className="dropdown-divider"></li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/datasets/paraview_info/223451/"
                    target="_blank"
                  >
                    View in Paraview
                  </a>
                </li>
              </menu>
            </p>
          </li>
          <li
            className="c-card--image-top c-card--plain"
            data-tag-change-from="article"
          >
            <img
              src="/media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__1000.0x1000.0_q85_subsampling-2.jpg"
              alt=""
              srcSet="
            
                /media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__576x576_q85_subsampling-2.jpg 576w,
            
                /media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__768x768_q85_subsampling-2.jpg 768w,
            
                /media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__992x992_q85_subsampling-2.jpg 992w,
            
            /media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__1000.0x1000.0_q85_subsampling-2.jpg 1000.0w
        "
              sizes="
            
                (max-width: 576px) 576px,
            
                (max-width: 768px) 768px,
            
                (max-width: 992px) 992px,
            
            1000.0px
        "
              className="img-fluid"
            />

            <p>
              <strong>Berea_2d25um_grayscale.raw</strong>
              <br />
              953.7 MB
            </p>

            <table className="c-data-list c-data-list--is-vert c-data-list--is-narrow c-data-list--should-truncate-values">
              <tbody>
                <tr>
                  <th className="c-data-list__key">Image Type</th>
                  <td className="c-data-list__value">8-bit</td>
                </tr>
                <tr>
                  <th className="c-data-list__key">Width</th>
                  <td className="c-data-list__value">1000</td>
                </tr>
                <tr>
                  <th className="c-data-list__key">Height</th>
                  <td className="c-data-list__value">1000</td>
                </tr>
                <tr>
                  <th className="c-data-list__key">Number of Slices</th>
                  <td className="c-data-list__value">1000</td>
                </tr>
                <tr className="c-data-list__row--start-final">
                  <th className="c-data-list__key">Byte Order</th>
                  <td className="c-data-list__value">little-endian</td>
                </tr>
              </tbody>
            </table>

            <p className="dropdown" data-tag-change-from="div">
              <button
                className="dropdown-toggle  c-button c-button--primary"
                data-toggle="dropdown"
                type="button"
              >
                Action
              </button>
              <menu className="dropdown-menu">
                <li>
                  <a
                    className="dropdown-item"
                    href="/datasets/317/images/223451/download/"
                    target="_blank"
                  >
                    Download File{' '}
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/media/projects/317/origin/1352/images/Berea_2d25um_grayscale.raw.gif"
                    target="_blank"
                  >
                    View GIF
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/media/projects/317/origin/1352/images/Berea_2d25um_grayscale.raw.histogram.jpg"
                    target="_blank"
                  >
                    Histogram
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/media/projects/317/origin/1352/images/Berea_2d25um_grayscale.raw.histogram.csv"
                    target="_blank"
                  >
                    Histogram (CSV)
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/datasets/317/images/223451/downloadMeta/"
                    target="_blank"
                  >
                    Metadata
                  </a>
                </li>
                <li className="dropdown-divider"></li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/datasets/paraview_info/223451/"
                    target="_blank"
                  >
                    View in Paraview
                  </a>
                </li>
              </menu>
            </p>
          </li>
          <li
            className="c-card--image-top c-card--plain"
            data-tag-change-from="article"
          >
            <img
              src="/media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__1000.0x1000.0_q85_subsampling-2.jpg"
              alt=""
              srcSet="
            
                /media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__576x576_q85_subsampling-2.jpg 576w,
            
                /media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__768x768_q85_subsampling-2.jpg 768w,
            
                /media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__992x992_q85_subsampling-2.jpg 992w,
            
            /media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__1000.0x1000.0_q85_subsampling-2.jpg 1000.0w
        "
              sizes="
            
                (max-width: 576px) 576px,
            
                (max-width: 768px) 768px,
            
                (max-width: 992px) 992px,
            
            1000.0px
        "
              className="img-fluid"
            />

            <p>
              <strong>Berea_2d25um_grayscale.raw</strong>
              <br />
              953.7 MB
            </p>

            <table className="c-data-list c-data-list--is-vert c-data-list--is-narrow c-data-list--should-truncate-values">
              <tbody>
                <tr>
                  <th className="c-data-list__key">Image Type</th>
                  <td className="c-data-list__value">8-bit</td>
                </tr>
                <tr>
                  <th className="c-data-list__key">Width</th>
                  <td className="c-data-list__value">1000</td>
                </tr>
                <tr>
                  <th className="c-data-list__key">Height</th>
                  <td className="c-data-list__value">1000</td>
                </tr>
                <tr>
                  <th className="c-data-list__key">Number of Slices</th>
                  <td className="c-data-list__value">1000</td>
                </tr>
                <tr className="c-data-list__row--start-final">
                  <th className="c-data-list__key">Byte Order</th>
                  <td className="c-data-list__value">little-endian</td>
                </tr>
              </tbody>
            </table>

            <p className="dropdown" data-tag-change-from="div">
              <button
                className="dropdown-toggle  c-button c-button--primary"
                data-toggle="dropdown"
                type="button"
              >
                Action
              </button>
              <menu className="dropdown-menu">
                <li>
                  <a
                    className="dropdown-item"
                    href="/datasets/317/images/223451/download/"
                    target="_blank"
                  >
                    Download File{' '}
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/media/projects/317/origin/1352/images/Berea_2d25um_grayscale.raw.gif"
                    target="_blank"
                  >
                    View GIF
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/media/projects/317/origin/1352/images/Berea_2d25um_grayscale.raw.histogram.jpg"
                    target="_blank"
                  >
                    Histogram
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/media/projects/317/origin/1352/images/Berea_2d25um_grayscale.raw.histogram.csv"
                    target="_blank"
                  >
                    Histogram (CSV)
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/datasets/317/images/223451/downloadMeta/"
                    target="_blank"
                  >
                    Metadata
                  </a>
                </li>
                <li className="dropdown-divider"></li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/datasets/paraview_info/223451/"
                    target="_blank"
                  >
                    View in Paraview
                  </a>
                </li>
              </menu>
            </p>
          </li>
          <li
            className="c-card--image-top c-card--plain"
            data-tag-change-from="article"
          >
            <img
              src="/media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__1000.0x1000.0_q85_subsampling-2.jpg"
              alt=""
              srcSet="
            
                /media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__576x576_q85_subsampling-2.jpg 576w,
            
                /media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__768x768_q85_subsampling-2.jpg 768w,
            
                /media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__992x992_q85_subsampling-2.jpg 992w,
            
            /media/filer_public_thumbnails/filer_public/30/62/3062e147-8fdb-4cd8-afa1-3fbbc6c42b31/dr-proj-317-data-1352.jpg__1000.0x1000.0_q85_subsampling-2.jpg 1000.0w
        "
              sizes="
            
                (max-width: 576px) 576px,
            
                (max-width: 768px) 768px,
            
                (max-width: 992px) 992px,
            
            1000.0px
        "
              className="img-fluid"
            />

            <p>
              <strong>Berea_2d25um_grayscale.raw</strong>
              <br />
              953.7 MB
            </p>

            <table className="c-data-list c-data-list--is-vert c-data-list--is-narrow c-data-list--should-truncate-values">
              <tbody>
                <tr>
                  <th className="c-data-list__key">Image Type</th>
                  <td className="c-data-list__value">8-bit</td>
                </tr>
                <tr>
                  <th className="c-data-list__key">Width</th>
                  <td className="c-data-list__value">1000</td>
                </tr>
                <tr>
                  <th className="c-data-list__key">Height</th>
                  <td className="c-data-list__value">1000</td>
                </tr>
                <tr>
                  <th className="c-data-list__key">Number of Slices</th>
                  <td className="c-data-list__value">1000</td>
                </tr>
                <tr className="c-data-list__row--start-final">
                  <th className="c-data-list__key">Byte Order</th>
                  <td className="c-data-list__value">little-endian</td>
                </tr>
              </tbody>
            </table>
            <p className="dropdown" data-tag-change-from="div">
              <button
                className="dropdown-toggle  c-button c-button--primary"
                data-toggle="dropdown"
                type="button"
              >
                Action
              </button>
              <menu className="dropdown-menu">
                <li>
                  <a
                    className="dropdown-item"
                    href="/datasets/317/images/223451/download/"
                    target="_blank"
                  >
                    Download File{' '}
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/media/projects/317/origin/1352/images/Berea_2d25um_grayscale.raw.gif"
                    target="_blank"
                  >
                    View GIF
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/media/projects/317/origin/1352/images/Berea_2d25um_grayscale.raw.histogram.jpg"
                    target="_blank"
                  >
                    Histogram
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/media/projects/317/origin/1352/images/Berea_2d25um_grayscale.raw.histogram.csv"
                    target="_blank"
                  >
                    Histogram (CSV)
                  </a>
                </li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/datasets/317/images/223451/downloadMeta/"
                    target="_blank"
                  >
                    Metadata
                  </a>
                </li>
                <li className="dropdown-divider"></li>
                <li>
                  <a
                    className="dropdown-item"
                    href="/datasets/paraview_info/223451/"
                    target="_blank"
                  >
                    View in Paraview
                  </a>
                </li>
              </menu>
            </p>
          </li>
        </ul>
      </section>

      <div className="o-section">
        <ul className="pagination">
          <li className="page-item">
            <a className="page-link" href="#">
              &lt; Previous
            </a>
          </li>
          <li className="page-item">
            <a className="page-link" href="#">
              1
            </a>
          </li>
          <li className="page-item">
            <a className="page-link" href="#">
              2
            </a>
          </li>
          <li className="page-item active">
            <span className="page-link">3</span>
          </li>
          <li className="page-item">
            <a className="page-link" href="#">
              4
            </a>
          </li>
          <li className="page-item">
            <a className="page-link" href="#">
              5
            </a>
          </li>
          <li className="page-item skip">
            <span className="page-link">...</span>
          </li>
          <li className="page-item">
            <a className="page-link" href="#">
              20
            </a>
          </li>
          <li className="page-item">
            <a className="page-link" href="#">
              Next &gt;
            </a>
          </li>
        </ul>
      </div>
    </>
  );
}
