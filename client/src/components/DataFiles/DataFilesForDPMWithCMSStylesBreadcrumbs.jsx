import React from 'react';

/**
 * Display CMS-styled breadcrumbs for the Digital Rocks Portal
 * XXX: This is static content specific to the Digital Rocks Portal interface.
 * @see https://pprd.digitalrocks.tacc.utexas.edu/datasets/
 * @see https://github.com/TACC/Core-CMS/blob/v4.30.0/taccsite_cms/templates/nav_cms_breadcrumbs.html
 * @returns {JSX.Element} - breadcrumbs
 */
const DataFilesForDPMWithCMSStylesBreadcrumbs = () => {
  const breadcrumbCSS = `
    .s-breadcrumbs a:not([href]) {
      opacity: 1;
      color: unset;
    }
  `;

  React.useEffect(() => {
    // Disable href for the current page breadcrumb
    const crumbs = document.getElementById('cms-breadcrumbs');
    const secondLink = crumbs && crumbs.querySelector('li:nth-of-type(2) > a');
    if (secondLink) secondLink.removeAttribute('href');
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: breadcrumbCSS }} />
      <nav className="s-breadcrumbs" id="cms-breadcrumbs">
        <ol itemScope itemType="https://schema.org/BreadcrumbList">
          <li itemScope
              itemProp="itemListElement"
              itemType="https://schema.org/ListItem"
          >
            <a href="/" itemProp="item">
              <span itemProp="name">Index</span>
            </a>
            <meta itemProp="position" content="1" />
          </li>
          <li itemScope
              itemProp="itemListElement"
              itemType="https://schema.org/ListItem"
          >
            <span itemProp="name">Browse Datasets</span>
            <meta itemProp="position" content="2" />
          </li>
        </ol>
      </nav>
    </>
  );
};

export default DataFilesForDPMWithCMSStylesBreadcrumbs;
