# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.1.2] - 2020-10-16: Job DateTime Fix and Bugfixes

### Added

- FP-570: Add Allocations Sagas Tests (#213)

### Changed

- Run actions on all PR Branches (#205)
- FP-735: Refactor Unauthed Ticket Creation (#210)
- FP-704: Remove citizenship field from Manage Account Required Information (#202)

### Fixed

- FP-723: Pin celery to 4.4.7 to resolve dependency issue (#203)
- Bump django from 2.2.7 to 2.2.13 (#206)
- FP-736: Fix Frontend Coverage (#212)
- FP-760: Show time according to client's time zone (#223)
- FP-738: Fix Timezone Offset from Tapis job DateTimes (#211)

### Removed

- FP-424: Remove unused Manage Account code (#200)

## [2.1.1] - 2020-08-24: Grey-Cardinal Release

### Fixed

- FP-658: Fix required text for ethnicity (#198)
- FP-654: Allow Open Session modal to use default x icon (#196)
- FP-657: Use system name instead of my data (#199)
- FP-655: Fix missing "Connect" button on interactive sessions (#197)

## [2.1.0] - 2020-08-21: Grey-Cardinal Release Beta Bugfixes Part 2

### Added

- FP-589: Add workPath to job modal (#183)
- FP-585: Show message when allocation missing for storage system (#176)
- FP-578: Show archive path when in terminal state (#189)
- FP-327: Onboarding welcome messages (#191)
- FP-647: Notify user on missing allocation (#194)
- FP-644: Show an error message if user is missing default storage system host allocation (#177)

### Changed

- FP-626: Remove exclamation points from various messages (#182)
- FP-641: Update Manage Allocations Wording (#187)
- FP-618, FP-588: Adjustments to marking notifications as "read" (#184)

### Fixed

- FP-637: Allow Open Session button to scroll with Jobs (#171)
- FP-648: Handle empty or null website in user profile (#186)
- FP-569: Fix job listings (#181)
- FP-627: Forbid moving/copying folders into themselves (#192)
- FP-614: Fixed percentage calculation and changed the way floats are displayed in the table (#193)

## [2.0.1] - 2020-08-19: Grey-Cardinal Release Beta Bugfixes

### Changed

- Change "Expires" to "Expired" in Allocations/Expired view (#174)
- FP-262: use SystemPushKeysModal for all key pushing operations (#46)
- FP-610: Simplify dates in Allocation (#165)
- FP-633: Alter Allocations sub table colors (#165)
- FP-628: Allow partial match of host resources when checking for allocation in applications (#170)
- Allow Message to accept JSX, not just text (#180)
- FP-605: change searchbar placeholder to "Search in Data Files" (#179)

### Fixed

- FP-568: Fix adding licenses in control panel (#145)
- FP-595: Handle errors in /api/datafiles/systems/list (#163)
- FP-596: Do not encode results of license_as_str for license model (#164)
- FP-584: Derive root name of breadcrumb from system list (#162)
- FP-561: Prevent users from being able to launch jobs with inactive allocations (#169)
- FP-599: Prevent logged in users from changing name/email on Ticket Submission (#166)
- FP-632: Fix ticket double reply issue (#173)
- FP-592: Fix Ticket Create modal for scaled views (#172)
- FP-591: Fix Jobs timezone display of job creation times (#167)
- FP-631: Manage Account UI adjustments and validation fixes (#168)

## [2.0.0] - 2020-08-12: Grey-Cardinal Release Beta

### Added

- FP-276: Add CSS linting
- FP-220: Add Onboarding unit tests
- FP-423: Add Manage Account unit tests
- FP-317: Add Job History view
- FP-339: Search backend enhancements
- FP-354: Add support messages and new icons
- FP-391: Add notifications backend using Django Channels and enables History on the frontend
- FP-506: Add `<DropdownSelector>` component
- FP-120: Add `<DataFilesSelectModal>` component and enable in app form inputs
- FP-557: Add `<dl>` description list component
- FP-565: Cache user allocations in ElasticSearch
- FP-535: Enable access for interactive job sessions
- FP-82: Add Notification `<Toast>` component and enable for job updates
- FP-204: Show a user's detailed allocations usage
- FP-341: Add and enable `<DataFilesSearchbar>` component in Data Files
- FP-318: Add and enable `<JobHistoryModal>` for detailed job information
- FP-372: Add private Longhorn system and support for multiple storage systems
- FP-218: Access multiple storage systems from Data Files modals

### Changed

- FP-275: Change tickets table to use the `<InfiniteScrollTable>` component
- FP-529, FP-562: Show simple English translations for job statuses from Tapis
- FP-228, FP-110: Replace Font Awesome icons with `<Icon>` component and custom Cortal icons
- FP-582: Generate ApiException when trying to perform cross system move

### Fixed

- FP-469: Display error message in Allocations view
- FP-396: Handle empty response for System Monitor in Dashboard view
- FP-463: Show warning message when Jobs listing fails
- FP-549: Handle all error codes in DataFilesTable
- FP-567: Handle and raise error when a user is missing a required license
- FP-579, FP-597: Scope styles to not bleed to other components

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

[unreleased]: https://github.com/TACC/Frontera-Portal/compare/v2.1.2...HEAD
[2.1.2]: https://github.com/TACC/Frontera-Portal/releases/tag/v2.1.2
[2.1.1]: https://github.com/TACC/Frontera-Portal/releases/tag/v2.1.1
[2.1.0]: https://github.com/TACC/Frontera-Portal/releases/tag/v2.1.0
[2.0.1]: https://github.com/TACC/Frontera-Portal/releases/tag/v2.0.1
[2.0.0]: https://github.com/TACC/Frontera-Portal/releases/tag/v2.0.0
[1.1.0]: https://github.com/TACC/Frontera-Portal/releases/tag/v1.1.0
[1.0.0]: https://github.com/TACC/Frontera-Portal/releases/tag/v1.0.0
