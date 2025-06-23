# Prompt for Next Session: Centralizing CMS Styles in Core-Portal Base Template

I need to centralize the CMS styles in our Core-Portal application by moving them from individual React components to the base.html template. Currently, the `DataFilesForDPMWithCMSStyles.jsx` component injects styles directly using inline `<style>` tags, but we've already implemented a custom event system (`cms-styles-activated` and `cms-styles-deactivated`) to conditionally load the CMS footer.

## Current Implementation:
- React components dispatch `cms-styles-activated` events when mounted
- The footer template listens for this event to load CMS footer content
- CSS is still injected directly by components using inline `<style>` tags

## What I Need:
1. Move the following CSS content from `DataFilesForDPMWithCMSStyles.jsx` to be dynamically loaded in base.html:
   - `externalCSS` which includes layer definitions and imports for CMS styles
   - `revertCSS` which includes fixes to align Portal styling with CMS

2. Add JavaScript to base.html that:
   - Listens for the `cms-styles-activated` event
   - Dynamically injects CSS when the event is triggered with `includeStyles: true`
   - Removes the CSS when `cms-styles-deactivated` is triggered
   - Avoids duplicate style injection if triggered multiple times

3. Update the React component to:
   - Remove inline `<style>` tags
   - Keep dispatching the custom events
   - Pass the appropriate parameters (`includeStyles: true`) in the event

## Code References:
- The existing styles are in `externalCSS` and `revertCSS` variables in `DataFilesForDPMWithCMSStyles.jsx`
- The custom event format is `cms-styles-activated` with detail containing `source`, `includeFooter`, and `includeStyles` parameters

Please help me implement this approach to make our application more maintainable and performant while preserving the current functionality.
