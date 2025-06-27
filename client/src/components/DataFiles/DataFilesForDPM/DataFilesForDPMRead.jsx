import React, { useEffect } from 'react';

// TODO: Replace use of this with component(s) from WC-219
export default function DataFilesForDPMRead() {
  useEffect(() => {
    // Or use `ShowMore` common component instead of `js-show-more` class
    import(
      'https://cdn.jsdelivr.net/gh/TACC/Core-Styles@v2.38.0/src/lib/_imports/components/c-show-more/c-show-more.js'
    )
      .then(({ generateMarkup }) => {
        generateMarkup(document.getElementsByClassName('js-show-more'), {
          shouldToggleResembleLink: true,
        });
      })
      .catch((err) => {
        console.error('Failed to load c-show-more module:', err);
      });
  }, []);

  return (
    <>
      <div className="o-section project-title">
        <h1>
          <span>11 Sandstones: Raw, Filtered and Segmented Data</span>{' '}
          <a
            className="c-button c-button--primary  project-download-button"
            data-target="#project-download-modal"
            data-toggle="modal"
            href="/media/filer_public_thumbnails/filer_public/65/10/6510c85e-4f00-4bde-b560-31614fb30ce0/dr-proj-317.png__768x768_subsampling-2.png"
            target="_blank"
          >
            <i
              className="icon icon-download
    c-button__icon--before"
            >
              ↓
            </i>{' '}
            Download Dataset
          </a>
        </h1>
      </div>
      <div className="o-section o-section--style-muted project-citation">
        <h3>Cite This Dataset</h3>
        <p>
          Neumann, R., Andreeta, M., &amp; Lucas-Oliveira, E.{' '}
          <em>11 Sandstones: raw, filtered and segmented data</em> [Data set].
          Digital Rocks Portal.{' '}
          <a
            href="https://doi.org/10.17612/F4H1-W124"
            rel="noreferrer"
            target="_blank"
            aria-label="Opens in new window."
          >
            https://doi.org/10.17612/F4H1-W124
          </a>
        </p>

        <p>
          <strong>Download Citation:</strong>
          {' '}
          <a
            href="https://api.datacite.org/application/vnd.datacite.datacite+xml/10.17612/f4h1-w124"
            rel="noreferrer"
            target="_blank"
            aria-label="Opens in new window."
          >
            DataCite XML
          </a>
          {' '}|{' '}
          <a
            href="https://api.datacite.org/application/x-research-info-systems/10.17612/f4h1-w124"
            rel="noreferrer"
            target="_blank"
            aria-label="Opens in new window."
          >
            RIS
          </a>
          {' '}|{' '}
          <a
            href="https://api.datacite.org/application/x-bibtex/10.17612/f4h1-w124"
            rel="noreferrer"
            target="_blank"
            aria-label="Opens in new window."
          >
            BibTeX
          </a>
          {' '}|{' '}
          <a
            href="https://commons.datacite.org/doi.org/10.17612/f4h1-w124"
            rel="noreferrer"
            target="_blank"
            aria-label="Opens in new window."
          >
            Other Formats
          </a>
          <br />
          <mark>
            <output>0</output> Citations
          </mark>
          {' '}|{' '}
          <strong>
            <a
              className="c-button c-button--as-link"
              data-target="#project-metrics-modal"
              data-toggle="modal"
              href="./metrics/"
            >
              Details
            </a>
          </strong>
        </p>
      </div>
      <div className="o-section o-section--style-light">
        <div className="row project-overview">
          <div className="col col-12 col-sm-12 col-md-3 col-lg-3 col-xl-3">
            <img
              src="/media/filer_public_thumbnails/filer_public/65/10/6510c85e-4f00-4bde-b560-31614fb30ce0/dr-proj-317.png__800.0x764.0_subsampling-2.png"
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
              className="align-left img-fluid"
            />
          </div>

          <div className="col project-desc">
            <p>
              A set of 11 sandstone plugs from Kocurek Industries: Bandera Gray,
              Parker, Kirby, Bandera Brown, Berea Sister Gray, Berea Upper Gray,
              Berea, Castlegate, Buff Berea, Leopard and Bentheimer. Source:{' '}
              <a
                href="https://kocurekindustries.com/sandstone-cores"
                target="_blank"
                rel="noreferrer"
                aria-label="Opens in new window."
              >
                https://kocurekindustries.com/sandstone-cores
              </a>
              . All samples were subject to a combined experimental and
              computational analysis in order to estimate Porosity and
              Permeability.
            </p>

            <p>
              For more details, please refer to{' '}
              <a
                href="https://arxiv.org/abs/2010.10679"
                target="_blank"
                rel="noreferrer"
                aria-label="Opens in new window."
              >
                https://arxiv.org/abs/2010.10679
              </a>
              .
            </p>

            <table className="c-data-list c-data-list--is-vert c-data-list--is-narrow">
              <tbody>
                <tr>
                  <th className="c-data-list__key">Author</th>
                  <td className="c-data-list__value">
                    Rodrigo Neumann (IBM Research)
                  </td>
                </tr>
                <tr>
                  <th className="c-data-list__key">Collaborators</th>
                  <td className="c-data-list__value">
                    <ul>
                      <li>MARIANE ANDREETA (USP)</li>
                      <li>
                        Everton Lucas-Oliveira (Universidade de São Paulo)
                      </li>
                    </ul>
                  </td>
                </tr>
                <tr>
                  <th className="c-data-list__key">Created</th>
                  <td className="c-data-list__value">Oct. 8, 2020</td>
                </tr>
                <tr>
                  <th className="c-data-list__key">License</th>
                  <td className="c-data-list__value">ODC-BY 1.0</td>
                </tr>
                <tr>
                  <th className="c-data-list__key">
                    Digital Object Identifier
                  </th>
                  <td className="c-data-list__value">10.17612/f4h1-w124</td>
                </tr>
                <tr>
                  <th className="c-data-list__key">Linked Datasets</th>
                  <td className="c-data-list__value">
                    <nav>
                      <a
                        href="https://doi.org/10.1038/s41598-021-90090-0"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Opens in new window."
                      >
                        <span>
                          11 Sandstones: raw, filtered and segmented data
                        </span>
                        <i className="icon icon-exit" aria-hidden="true"></i>
                      </a>
                      <a
                        href="https://doi.org/10.1016/j.petrol.2020.107400"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Opens in new window."
                      >
                        <span>
                          Sandstone surface relaxivity determined by NMR T2
                          distribution and digital rock simulation for
                          permeability evaluation
                        </span>
                        <i className="icon icon-exit" aria-hidden="true"></i>
                      </a>
                    </nav>
                  </td>
                </tr>
                <tr className="sample">
                  <th className="c-data-list__key">Cited By</th>
                  <td className="c-data-list__value">
                    <nav>
                      <a href="#" target="_blank">
                        <span>
                          Example citation entry (Sample data - Not actual
                          citations)
                        </span>
                        <i className="icon icon-exit" aria-hidden="true"></i>
                      </a>
                      <a href="#" target="_blank">
                        <span>
                          Another example of what a citation would look like
                          when this feature is implemented
                        </span>
                        <i className="icon icon-exit" aria-hidden="true"></i>
                      </a>
                    </nav>
                  </td>
                </tr>
                <tr className="sample">
                  <th className="c-data-list__key">Context</th>
                  <td className="c-data-list__value">
                    <nav>
                      <a href="#" target="_blank">
                        <span>
                          Sample contextual reference - This section will show
                          related context
                        </span>
                        <i className="icon icon-exit" aria-hidden="true"></i>
                      </a>
                      <a href="#" target="_blank">
                        <span>
                          Example of how additional context entries would appear
                          when this feature is implemented
                        </span>
                        <i className="icon icon-exit" aria-hidden="true"></i>
                      </a>
                    </nav>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div className="project-content">
          <div id="project-files">
            <h2>Files</h2>

            <ul className="data-tree">
              <li className="data-tree__item" id="sample-berea">
                <details>
                  <summary className="u-summary-link-merged">
                    <a className="u-title-needs-colon">
                      <span>Sample</span>
                      <strong>Berea</strong>
                    </a>
                  </summary>
                  {/* <p className="js-show-more"> */}
                  {/* only if desc is very long, then add className "js-show-more" or try `ShowMore` common component */}
                  <p>
                    Berea sandstone sample. For experimental and computational
                    estimates of porosity and permeability, please refer to the
                    related publications.
                  </p>
                  <table className="c-data-list c-data-list--is-vert c-data-list--is-narrow c-data-list--should-truncate-values">
                    <tbody>
                      <tr>
                        <th className="c-data-list__key">Porous Media Type</th>
                        <td className="c-data-list__value">Sandstone</td>
                      </tr>
                      <tr>
                        <th className="c-data-list__key">Source</th>
                        <td className="c-data-list__value">Natural</td>
                      </tr>
                      <tr>
                        <th className="c-data-list__key">Grain Size</th>
                        <td className="c-data-list__value">
                          <dl>
                            <dt>Minimum</dt>
                            <dd>N/A</dd>
                            <dt>Maximum</dt>
                            <dd>N/A</dd>
                            <dt>Average</dt>
                            <dd>N/A</dd>
                          </dl>
                        </td>
                      </tr>
                      <tr>
                        <th className="c-data-list__key">Porosity</th>
                        <td className="c-data-list__value">18.96</td>
                      </tr>
                      <tr>
                        <th className="c-data-list__key">Location</th>
                        <td className="c-data-list__value">—</td>
                      </tr>
                    </tbody>
                  </table>
                </details>
                <ul>
                  <li>
                    <a
                      className="u-title-needs-colon"
                      href="/datasets/317/origin-data/1352/"
                    >
                      <span>Origin Data</span>
                      <strong>Berea_2d25um_grayscale.raw</strong>
                    </a>
                  </li>
                  <li>
                    <a
                      className="u-title-needs-colon"
                      href="/datasets/317/origin-data/1352/"
                    >
                      <span>Origin Data</span>
                      <strong>Berea_2d25um_grayscale_filtered.raw</strong>
                    </a>
                  </li>
                  <li>
                    <a
                      className="u-title-needs-colon"
                      href="/datasets/317/origin-data/1352/"
                    >
                      <span>Origin Data</span>
                      <strong>Berea_2d25um_binary.raw</strong>
                    </a>
                  </li>
                </ul>
              </li>
              <li className="data-tree__item" id="sample-bandera-brown">
                <details>
                  <summary className="u-summary-link-merged">
                    <a className="u-title-needs-colon">
                      <span>Sample</span>
                      <strong>Bandera Brown</strong>
                    </a>
                  </summary>
                  {/* <p className="js-show-more"> */}
                  {/* only if desc is very long, then add className "js-show-more" or try `ShowMore` common component */}
                  <p>
                    Bandera Brown sandstone sample. For experimental and
                    computational estimates of porosity and permeability, please
                    refer to the related publications.
                  </p>
                  <table className="c-data-list c-data-list--is-vert c-data-list--is-narrow c-data-list--should-truncate-values">
                    <tbody>
                      <tr>
                        <th className="c-data-list__key">Porous Media Type</th>
                        <td className="c-data-list__value">Sandstone</td>
                      </tr>
                      <tr>
                        <th className="c-data-list__key">Source</th>
                        <td className="c-data-list__value">Natural</td>
                      </tr>
                      <tr>
                        <th className="c-data-list__key">Grain Size</th>
                        <td className="c-data-list__value">
                          <dl>
                            <dt>Minimum</dt>
                            <dd>N/A</dd>
                            <dt>Maximum</dt>
                            <dd>N/A</dd>
                            <dt>Average</dt>
                            <dd>N/A</dd>
                          </dl>
                        </td>
                      </tr>
                      <tr>
                        <th className="c-data-list__key">Porosity</th>
                        <td className="c-data-list__value">24.11</td>
                      </tr>
                      <tr>
                        <th className="c-data-list__key">Location</th>
                        <td className="c-data-list__value">—</td>
                      </tr>
                    </tbody>
                  </table>
                </details>
                <ul>
                  <li>
                    <a
                      className="u-title-needs-colon"
                      href="/datasets/317/origin-data/1352/"
                    >
                      <span>Origin Data</span>
                      <strong>BanderaBrown_2d25um_grayscale.raw</strong>
                    </a>
                  </li>
                  <li>
                    <a
                      className="u-title-needs-colon"
                      href="/datasets/317/origin-data/1352/"
                    >
                      <span>Origin Data</span>
                      <strong>BanderaBrown_2d25um_binary.raw</strong>
                    </a>
                  </li>
                  <li>
                    <a
                      className="u-title-needs-colon"
                      href="/datasets/317/origin-data/1352/"
                    >
                      <span>Origin Data</span>
                      <strong>
                        BanderaBrown_2d25um_grayscale_filtered.raw
                      </strong>
                    </a>
                  </li>
                </ul>
              </li>
              <li className="data-tree__item" id="sample-bandera-gray">
                <details>
                  <summary className="u-summary-link-merged">
                    <a className="u-title-needs-colon">
                      <span>Sample</span>
                      <strong>Bandera Gray</strong>
                    </a>
                  </summary>
                  {/* <p className="js-show-more"> */}
                  {/* only if desc is very long, then add className "js-show-more" or try `ShowMore` common component */}
                  <p>
                    Bandera Gray sandstone sample. For experimental and
                    computational estimates of porosity and permeability, please
                    refer to the related publications.
                  </p>
                  <table className="c-data-list c-data-list--is-vert c-data-list--is-narrow c-data-list--should-truncate-values">
                    <tbody>
                      <tr>
                        <th className="c-data-list__key">Porous Media Type</th>
                        <td className="c-data-list__value">Sandstone</td>
                      </tr>
                      <tr>
                        <th className="c-data-list__key">Source</th>
                        <td className="c-data-list__value">Natural</td>
                      </tr>
                      <tr>
                        <th className="c-data-list__key">Grain Size</th>
                        <td className="c-data-list__value">
                          <dl>
                            <dt>Minimum</dt>
                            <dd>N/A</dd>
                            <dt>Maximum</dt>
                            <dd>N/A</dd>
                            <dt>Average</dt>
                            <dd>N/A</dd>
                          </dl>
                        </td>
                      </tr>
                      <tr>
                        <th className="c-data-list__key">Porosity</th>
                        <td className="c-data-list__value">18.1</td>
                      </tr>
                      <tr>
                        <th className="c-data-list__key">Location</th>
                        <td className="c-data-list__value">—</td>
                      </tr>
                    </tbody>
                  </table>
                </details>
                <ul>
                  <li>
                    <a
                      className="u-title-needs-colon"
                      href="/datasets/317/origin-data/1352/"
                    >
                      <span>Origin Data</span>
                      <strong>BanderaGray_2d25um_binary.raw</strong>
                    </a>
                  </li>
                  <li>
                    <a
                      className="u-title-needs-colon"
                      href="/datasets/317/origin-data/1352/"
                    >
                      <span>Origin Data</span>
                      <strong>BanderaGray_2d25um_grayscale_filtered.raw</strong>
                    </a>
                  </li>
                  <li>
                    <a
                      className="u-title-needs-colon"
                      href="/datasets/317/origin-data/1352/"
                    >
                      <span>Origin Data</span>
                      <strong>BanderaGray_2d25um_grayscale.raw</strong>
                    </a>
                  </li>
                </ul>
              </li>
              <li className="data-tree__item" id="sample-bentheimer">
                <details>
                  <summary className="u-summary-link-merged">
                    <a className="u-title-needs-colon">
                      <span>Sample</span>
                      <strong>Bentheimer</strong>
                    </a>
                  </summary>
                  {/* <p className="js-show-more"> */}
                  {/* only if desc is very long, then add className "js-show-more" or try `ShowMore` common component */}
                  <p>
                    Bentheimer sandstone sample. For experimental and
                    computational estimates of porosity and permeability, please
                    refer to the related publications.
                  </p>
                  <table className="c-data-list c-data-list--is-vert c-data-list--is-narrow c-data-list--should-truncate-values">
                    <tbody>
                      <tr>
                        <th className="c-data-list__key">Porous Media Type</th>
                        <td className="c-data-list__value">Sandstone</td>
                      </tr>
                      <tr>
                        <th className="c-data-list__key">Source</th>
                        <td className="c-data-list__value">Natural</td>
                      </tr>
                      <tr>
                        <th className="c-data-list__key">Grain Size</th>
                        <td className="c-data-list__value">
                          <dl>
                            <dt>Minimum</dt>
                            <dd>N/A</dd>
                            <dt>Maximum</dt>
                            <dd>N/A</dd>
                            <dt>Average</dt>
                            <dd>N/A</dd>
                          </dl>
                        </td>
                      </tr>
                      <tr>
                        <th className="c-data-list__key">Porosity</th>
                        <td className="c-data-list__value">22.64</td>
                      </tr>
                      <tr>
                        <th className="c-data-list__key">Location</th>
                        <td className="c-data-list__value">—</td>
                      </tr>
                    </tbody>
                  </table>
                </details>
                <ul>
                  <li>
                    <a
                      className="u-title-needs-colon"
                      href="/datasets/317/origin-data/1352/"
                    >
                      <span>Origin Data</span>
                      <strong>Bentheimer_2d25um_binary.raw</strong>
                    </a>
                  </li>
                  <li>
                    <a
                      className="u-title-needs-colon"
                      href="/datasets/317/origin-data/1352/"
                    >
                      <span>Origin Data</span>
                      <strong>Bentheimer_2d25um_grayscale_filtered.raw</strong>
                    </a>
                  </li>
                  <li>
                    <a
                      className="u-title-needs-colon"
                      href="/datasets/317/origin-data/1352/"
                    >
                      <span>Origin Data</span>
                      <strong>Bentheimer_2d25um_grayscale.raw</strong>
                    </a>
                  </li>
                </ul>
              </li>
              <li className="data-tree__item" id="sample-berea-sister-gray">
                <details>
                  <summary className="u-summary-link-merged">
                    <a className="u-title-needs-colon">
                      <span>Sample</span>
                      <strong>Berea Sister Gray</strong>
                    </a>
                  </summary>
                  {/* <p className="js-show-more"> */}
                  {/* only if desc is very long, then add className "js-show-more" or try `ShowMore` common component */}
                  <p>
                    Berea Sister Gray sandstone sample. For experimental and
                    computational estimates of porosity and permeability, please
                    refer to the related publications.
                  </p>
                  <table className="c-data-list c-data-list--is-vert c-data-list--is-narrow c-data-list--should-truncate-values">
                    <tbody>
                      <tr>
                        <th className="c-data-list__key">Porous Media Type</th>
                        <td className="c-data-list__value">Sandstone</td>
                      </tr>
                      <tr>
                        <th className="c-data-list__key">Source</th>
                        <td className="c-data-list__value">Natural</td>
                      </tr>
                      <tr>
                        <th className="c-data-list__key">Grain Size</th>
                        <td className="c-data-list__value">
                          <dl>
                            <dt>Minimum</dt>
                            <dd>N/A</dd>
                            <dt>Maximum</dt>
                            <dd>N/A</dd>
                            <dt>Average</dt>
                            <dd>N/A</dd>
                          </dl>
                        </td>
                      </tr>
                      <tr>
                        <th className="c-data-list__key">Porosity</th>
                        <td className="c-data-list__value">19.07</td>
                      </tr>
                      <tr>
                        <th className="c-data-list__key">Location</th>
                        <td className="c-data-list__value">—</td>
                      </tr>
                    </tbody>
                  </table>
                </details>
                <ul>
                  <li>
                    <a
                      className="u-title-needs-colon"
                      href="/datasets/317/origin-data/1352/"
                    >
                      <span>Origin Data</span>
                      <strong>BSG_2d25um_grayscale.raw</strong>
                    </a>
                  </li>
                  <li>
                    <a
                      className="u-title-needs-colon"
                      href="/datasets/317/origin-data/1352/"
                    >
                      <span>Origin Data</span>
                      <strong>BSG_2d25um_grayscale_filtered.raw</strong>
                    </a>
                  </li>
                  <li>
                    <a
                      className="u-title-needs-colon"
                      href="/datasets/317/origin-data/1352/"
                    >
                      <span>Origin Data</span>
                      <strong>BSG_2d25um_binary.raw</strong>
                    </a>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div
        className="modal fade"
        id="project-download-modal"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="project-download-modal-title"
        aria-hidden="true"
      >
        <div
          className="modal-dialog modal-dialog-centered modal-lg"
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="project-download-modal-title">
                Download Dataset
              </h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <i aria-hidden="true">×</i>
              </button>
            </div>
            <div className="modal-body">
              <p>
                This download is a ZIP file of the complete project dataset. The
                size of the ZIP file is <strong>41.28 MB</strong>.
              </p>
              <hr />
              <p>The files are licensed by the following:</p>
              <ul className="license-list">
                <li className="license">
                  <h4 className="license__title">
                    <i className="icon icon-file" data-label="ODC"></i>
                    <span>
                      <strong>
                        Open Data Commons Attribution License (ODC-By) v1.0
                      </strong>
                      (
                      <a
                        href="https://opendatacommons.org/licenses/by/1-0/"
                        target="_blank"
                        rel="noreferrer"
                        aria-label="Opens in new window."
                      >
                        License Website
                      </a>
                      )
                    </span>
                  </h4>
                  <ul className="license__details">
                    <li>
                      You may […] restrictions lorem ipsum dolor sit amet,
                      consectetur adipiscing elit.
                    </li>
                    <li>
                      You […] attributed […] this work consectetur adipiscing
                      elit.
                    </li>
                  </ul>
                </li>
              </ul>
              <small>
                <a
                  href="https://example.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Opens in new window."
                >
                  Data Usage Agreement
                </a>
              </small>
            </div>
            <div className="modal-footer">
              <a
                className="c-button c-button--primary  project-download-button"
                download="digitalrocksportal-org-project-317.zip"
                target="_blank"
                href="https://www.digitalrocksportal.org/media/projects/317/archive.zip"
                rel="noreferrer"
                aria-label="Opens in new window."
              >
                <i className="icon icon-download  c-button__icon--before">↓</i>
                Download Dataset
              </a>
            </div>
          </div>
        </div>
      </div>
      <div
        className="modal fade"
        id="project-metrics-modal"
        tabIndex="-1"
        role="dialog"
        aria-labelledby="project-metrics-modal-title"
        aria-hidden="true"
      >
        <div
          className="modal-dialog modal-dialog-centered modal-xl"
          role="document"
        >
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="project-metrics-modal-title">
                Dataset metrics
              </h5>
              <button
                type="button"
                className="close"
                data-dismiss="modal"
                aria-label="Close"
              >
                <i aria-hidden="true">×</i>
              </button>
            </div>
            <div className="modal-body">
              <div className="metrics-tableset">
                <table>
                  <thead>
                    <tr>
                      <th>Aggregated Usage</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        Unique Investigations
                        <small className="metrics-note">(views)</small>
                        <i
                          title="Refers to the number of one-hour sessions during which a user previewed/downloaded/copied files associated with this DOI."
                          data-title="Unique Investigations (Views)"
                        >
                          ?
                        </i>
                      </td>
                      <td>0</td>
                    </tr>
                    <tr>
                      <td>
                        Unique Requests
                        <small className="metrics-note">(downloads)</small>
                        <i
                          title="Refers to the number of one-hour sessions during which a user previewed/downloaded/copied files associated with this DOI."
                          data-title="Unique Requests (Downloads)"
                        >
                          ?
                        </i>
                      </td>
                      <td>0</td>
                    </tr>
                    <tr>
                      <td>
                        Total Requests
                        <i
                          title="Refers to the number of one-hour sessions during which a user previewed/downloaded/copied files associated with this DOI."
                          data-title="Total Requests"
                        >
                          ?
                        </i>
                      </td>
                      <td>0</td>
                    </tr>
                  </tbody>
                </table>
                <table>
                  <thead>
                    <tr>
                      <th>
                        <span className="u-thead-content-with-input">
                          Quarter
                          <select>
                            <option>No Data</option>
                          </select>
                        </span>
                      </th>
                      <th>Unique Investigations</th>
                      <th>Unique Requests</th>
                      <th>Total Requests</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Jan-Mar</td>
                      <td>--</td>
                      <td>--</td>
                      <td>--</td>
                    </tr>
                    <tr>
                      <td>Apr-Jun</td>
                      <td>--</td>
                      <td>--</td>
                      <td>--</td>
                    </tr>
                    <tr>
                      <td>Jul-Sep</td>
                      <td>--</td>
                      <td>--</td>
                      <td>--</td>
                    </tr>
                    <tr>
                      <td>Oct-Dec</td>
                      <td>--</td>
                      <td>--</td>
                      <td>--</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="metrics-caption  c-message c-message--type-info c-message--scope-section">
                These metrics are presented according to the{' '}
                <a
                  href="https://makedatacount.org/"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Opens in new window."
                >
                  Make Data Count
                </a>{' '}
                standard.
              </p>
            </div>
            <div className="modal-footer">
              <small className="metrics-note">
                Metrics recorded since January 2022.
              </small>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
