# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2020-06-16

### Added

- FP-244: Add error message for attachments that exceed file size limits
- FP-292: Commit package-lock.json
- FP-236: Dynamically populate CMS tabs in portal navbar
- FP-30: Detect browser type in portal and show message if not supported
- FP-176: Add Front end unit tests for tickets
- FP-409: Add app icons to job history listing
- FP-279: Scroll Ticket Dialog to last message when opened
- FP-125: Form submission via enter key
- FP-420: Add support for CSS Modules
- FP-224: Add dropzone to File Upload Modal

### Changed

- CEPWMA-626: Hide spinner during move/copy/trash operations
- FP-278: Refactor FileInputDropZone
- FP-270: Swap ticket message subject text
- FP-175: Use formik for ticket reply and create forms
- FP-152: Move Manage Account to React App
- FP-254: Team view modal optimization
- FP-417: Apps sidebar & app tray link height adjustments
- FP-387: Added inifinte scroll to the jobs listing component
- FP-456: Load production images of CMS and Docs locally
- FP-134: Enhance design of Data Files "+ Add" button dropdown

### Fixed

- FP-272: Update resources loaded for header
- FP-294: Fixed tapis token refresh
- FP-232: Handle error display in Tickets List component
- FP-398: Handle Codecov error in GH actions
- FP-253: Reflect ticket status updates in Dashboard
- FP-251: Display Ticket ID in detailed ticket modal
- FP-389: Fix apps section overlap of nav items
- FP-272: Fix resources loaded for header

### Removed

- FP-189: Delete unused backend ticket code

## [1.0.0] - 2020-02-28
v1.0.0 Production release as of Feb 28, 2020.

[unreleased]: https://github.com/TACC/Frontera-Portal/compare/v1.0.0...HEAD
[1.1.0]: https://github.com/TACC/Frontera-Portal/releases/tag/v1.1.0
[1.0.0]: https://github.com/TACC/Frontera-Portal/releases/tag/v1.0.0
