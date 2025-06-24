import React from 'react';

export default function CMSBreadcrumbs() {
  /* TODO: Move to …module.css OR into Core-Styles */
  /* https://github.com/TACC/Core-CMS/blob/v4.30.0/taccsite_cms/templates/nav_cms_breadcrumbs.html#L4-L11 */
  const breadcrumbCSS = `
    .s-breadcrumbs a:not([href]) {
      opacity: 1;
      color: unset;
    }
  `;

  /* TODO: Migrate to JSX logic (when it exists) */
  React.useEffect(() => {
    // Disable href for the current page breadcrumb
    const crumbs = document.getElementById('cms-breadcrumbs');
    const secondLink = crumbs && crumbs.querySelector('li:nth-of-type(2) > a');
    if (secondLink) secondLink.removeAttribute('href');
  }, []);

  /* TODO: Render based on data param, not as static content */
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
