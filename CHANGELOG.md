# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.10.0] - 2021-09-30: CMS Login; UTRC Conversion; Styling Fixes

### Added

- FP-1194: Support CMS login (#494)
- FP-1214: Add HPC System Access Onboarding Step (#503)
- FP-1130: Add Shared Workspaces Search Toggle (#464)
- FP-1195: Allow Customization of onboarding route (#498)
- FP-1102: Add ability to compress folder to folder download message modal (#499)

### Changed

- FP-1132: ReadMore component adjustments (#481)
- FP-1082/FP-1083: Fix Color Contrast of Accent Color & Body Text (#452)
- FP-1116: Replace Bootstrap Alerts with SectionMessage in ManageAccount.js (#496)
- FP-1016: Disabled Trash button for files in .Trash. (#483)
- FP-212/FP-1171: Make 3rd party integrations more dynamic (#484)
- FP-1096: Update search text when not enough characters (#486)
- FP-1165: Changed all welcome files and components to intro (#485)
- FP-1202: changed close button color (#497)
- FP-1170: Add filesize to datafiles preview logs (#510)
- FP-1006: Compress/Extract Toolbar App Adjustments (#508)

### Fixed

- FP-1034: Better Handle 400s on File Listings (#431)
- FP-1171: Expand Data Files toggle (#476)
- FP-1201: handle missing pi in project metadata (#492)
- Reduce Elasticsearch load time (#478)
- FP-1008: Fix disabled Data Files dropdown styles (#491)
- FP-1071: Hide "Return to Shared Workspaces" in File Selector Modal (#493)
- FP-1111: Dashboard Job History "Job Status" column overflow (#502)
- FP-1169: Fix Paginator component (#500)
- FP-1059: Fix "Shared Workspaces" Breadcrumb in File Selector Modal (#470)
- FP-1196: Prevent Push Keys Modal on Files Listing 400 for non-public systems (#506)
- FP-1011: Fix large image preview loading artifact (#490)

### Removed

- FP-1052: Remove work2 Welcome Message (#489)

## [2.9.0] - 2021-09-01: Shared Workspace Updates; Cortal Icons

### Changed

- FP-1142: Distinguish types of message text constants (#445)
- FP-1153: Shared Workspaces Icon (#466)
- FP-223: Add Custom Close Icon to Modals (#465)
- FP-635: Remove Font Awesome Icons (#469)
- Reduce Body Min-* Verbosity (#421)
- FP-1089: Update ProjectId on collision (#459)
- FP-1143: Convert underscore to hyphen in system ids (#461)
- FP-1150: 150 max character limit for shared workspace title (#460)
- FP-1171: Toggle data files [A2CPS] (#471)
- FP-1128: Accommodate non-portal created Projects (#458)

### Fixed

- FP-1151: Shared workspace privilege bypass (#462)

## [2.8.0] - 2021-08-10: Data Files Filter; Custom Settings for A2CPS

### Added

- FP-508: Data Files Filter (#455)
- FP-195: Enable Django impersonate feature (#456)

### Changed

- FP-1004: Update Onboarding Step Description Text (#454)
- FP-1118: Support no datafiles systems (#449)
- FP-1117: Read only shared workspace setting (#450)
- FP-1129: Toggle Apps and History Sections (#447)
- FP-1134: Toggle Manage Team and Edit Description (#451)
- FP-952: Replace Django Messages with Client Side Messages (#443)

### Fixed

- FP-1110: Shared workspace description character limit (#444)
- FP-1133: Ensure that Frontera-related normal queue validation occurs only on Frontera (#446)
- FP-1080: Fix search loading (#453)
- FP-1139: Update allocations cache during login (#448)

## [2.7.0] - 2021-07-13: Apps, Shared Workspaces Improvements

### Added

- FP-1060: Folder download message (#425)

### Changed

- FP-1027: Remove unrelated objects from app definition (#387)
- FP-939: Display shared workspace description whitespace. (#435)
- FP-997, FP-1041, FP-1042: Improve apps, add small queue support, and update execution systems when needed (#426)
- FP-573: Prevent submitting unlicensed app (#438)
- FP-1009: Apply ReadMore UI pattern to long Shared Workspace descriptions (#442)
- FP-1031: Clarify Onboarding MFA Steps (#441)
- FP-1007: Remove inactive toolbar buttons for public/community/google drive (#436)

### Fixed

- FP-1095: Adjust colors of links in Manage Account to match the website's theme. (#430)
- FP-1108: Fix HTML App Loading (#437)
- FP-1030: Fix breadcrumbs for application page (#434)

## [2.6.1] - 2021-06-15: Hotfix: Fix settings import

### Fixed

- Hotfix: Fix missing extension on settings import (#427)

## [2.6.0] - 2021-06-14: Separate Custom Settings From Secrets

### Changed

- FP-304: Separate custom settings from secrets (#393)

## [2.5.0] - 2021-06-14: Section Components; Workspace bugfixes

### Added

- FP-813: Download Filesize Metrics (#396)
- FP-563: Support Count of Search Results in UI. (#403)
- FP-1037: Management commands for forcing system creation (#414)

### Changed

- Update README.md (#397, #416, #418, #419)
- FP-594: Ensure search result matches contain the entire search query (#399)
- FP-250: Upload Modal Error Messages (#392)
- FP-962, FP-385: Section Components (#350)
- FP-1061: Disable “Upload Selected” button when no valid files or nothing to upload. (#409)
- FP-1005: "Make Public" Adjustments. (#413)
- FP-526: Update Header Dropdown to Use Cortal Icons (#417)
- FP-1020: Index project after migrating (#423)
- FP-995: Rename system prefix setting to `PORTAL_PROJECTS_SYSTEM_ PREFIX` (#424)

### Fixed

- FP-1039 push keys job submission fix (#400)
- FP-1000: Remove falsy values from job submission (#402)
- FP-1038: Fix race condition causing `Cannot read property 'system' of undefined` bug (#404)
- FP-1045, FP-1048, FP-1049: Various jobs fixes (#394)
- Hotfix: Layout and Appform bugfixes (#405)
- FP-1064: Remove problematic TOGGLE_SUBMITTING action from saga (#407)
- FP-1062: Only open data files select modal when pushing keys to access data files (#411)
- Hotfix: Change stampede2 homeDir to /home1; add maverick2 (#412)
- FP-1065: Fix issues with site search header and spacing (#410)
- FP-1021: Fix Shared Workspace search issue. (#415)
- FP-1067: Prevent certain table columns from squishing content (#422)
- FP-1010: Fix Erroneous Font-Weight 500's (#420)

## [2.4.2] - 2021-05-04: Portal User Nav endpoint; `projects_id` command; Bugfixes

### Added

- FP-980: `projects_id` management command (#375)
- FP-1015: Allow Portal Nav to be Cloned (#390)

### Changed

- Quick: Add Portal Templates to CMS Sample Secrets (#389)
- FP-1014: Add Onboarding Admin link to User Nav Dropdown (#388)

### Fixed

- FP-139: Disable Upload Modal Actions while In Progress. (#383)
- FP-642: Fix push key modal from select modal (#219)

## [2.4.1] - 2021-04-16: Bugfixes; `work2` Message

### Added

- FP-976: Add configurable work2 Alert message (#373)

### Changed

- Quick: Have Data List Cells use Util Functions (#378)
- Quick: Update Sample CMS Settings (#376)
- Update local certs (#372)
- FP-883: Pass PORTAL_NAMESPACE to front end for use in Feedback Form (#374)
- FP-338: File Uploader UI (#309)
- FP-630: Notify user to push keys before starting app (#359)

### Fixed

- FP-984: Fix Onboarding Search Query (#379)
- FP-985: Fix window search overwriting site search query (#380)
- FP-973: Enable Copy button/operation in Public Data and Community Data (#384)
- FP-1013: Disable copying to non-private systems in copy modal (#385)

## [2.4.0] - 2021-03-26: CEPv2 Release

### Added

- FP-889: Add searchbar to Public Data view. (#366)
- FP-739: Add Make Public button. (#318)
- FP-688: Unauthenticated Public Data (#281)
- FP-531: search bar in header (#290)
- FP-922: updates for CEPv1 project migration (#364)
- FP-877: Onboarding admin (#349)
- FP-123: Add incremented file number to files copied into the same directory. (#79)
- FP-881: unit testing for toast message (#355)
- FP-802: Paginator component (#348)
- FP-369: DataFiles Toolbar Compress and Extract buttons (#264)
- FP-837: add unit tests for file preview and determine file size in back end (#300)
- FP-874: ReadMore expandable text component proof of concept (#336)
- FP-862: load branding from cms (#334)
- FP-828: Prevent write operations on protected files (#321)
- FP-780: add indexing and searchbar for projects (#316)
- FP-817: TextCopyField user feedback (#293)
- FP-838: allow git tags as docker image tags (#303)

### Changed

- Add some intitial steps to README (#367)
- FP-895: Re-style site search file listing as a table (#353)
- FP-950: Quick: Remove <Message type="info"> icon (#362)
- FP-385: section comp welcome msg patterns (#347)
- FP-898: onboarding system health checks (#345)
- FP-908: Hide empty application tabs (#343)
- Bump poetry version (#356)
- Quick: Resolve Secrets Delta (#294)
- FP-884 modal title styles (#339)
- FP-661: Edit error message in push keys modal (#271)
- Bump cryptography from 2.7 to 3.2 in /server (#230)
- FP-827: Assorted Dashboard Fixes (#331)
- Rename master to main (#340)
- FP-836: Rename Frontera-Portal repo to Core-Portal (#329)
- FP-834: feedback modal updates (#319)
- Quick: Clarify Message prop deprecation warning (#335)
- FP-866: handle potential delay in systems list retrieval (#330)
- FP-820: Show loading spinner during iframe load (#324)
- FP-653: Add explicit mapping for Corral system name (#323)
- FP-121: Add app browser unit test (#298)
- FP-867: Fix JWT Auth (#325)
- FP-664: Add system name to directory creation modal. (#273)
- FP-832: Update onboarding step description texts (#306)
- Update readme (#315)
- Disable codecov annotations; pr template adjustment; branch deploys (#297)

### Removed

- FP-749: remove unused system manager code (#338)

### Fixed

- FP-975: Fix `StopIteration` error for backend Jobs listing (#369)
- Quick: Fix Onboarding MFA step desc. typo (#371)
- FP-972: Unsqueeze onboarding status loading icon (#370)
- FP-970: Make columns depenedent on fileNavCellCallback to handle scheme changes (#365)
- FP-885: Ignore allocation checks to cloud.corral and data.tacc (#351)
- FP-960: Fix migration & db export bugs (#361)
- FP-906: Clear search bar in Data Files when changing systems. (#352)
- FP-821: Google Drive UI fixes (#354)
- FP-891: fix external workbench access disrupted by onboarding (#358)
- FP-880: Skip project members that have no user object (#344)
- FP-896: Fix add definition to list (#342)
- FP-800: Fix incorrect path and typo in nginx.conf (#341)
- FP-824: Combined projects fixes (#326)
- FP-803: Handle error during data files scrolling (#322)
- FP-868: Set project ACLs for each member on creation (#328)
- FP-860: Get job output location from notification info (#317)
- FP-855: Disable add and upload buttons when user cannot write to system (#314)
- FP-850: Disable make link on community and public data (#313)
- FP-835: ticket create modal UI fixes (#305)
- FP-831: Allow multiple <dd> elements when data is Array in DescriptionList (#299)
- FP-832: Disable search bar when error in files listing (#304)
- FP-815: prevent View Path from appearing when browsing Google Drive (#292)
- FP-825: Fix HTML app loading (#295)
- FP-814: public url fixes from testing (#291)
- FP-823: Project add user list shows all users, project creation failure persists (#296)

## [2.3.0] - 2020-12-21: Shared Workspaces, Site Search, Apps Metadata, Google Drive

### Added

- FP-690: Google Drive integration
- FP-213: Shared Workspaces Frontend
- FP-208: Site Search
- FP-694: Site Metrics
- FP-698: Jupyter Mounts endpoint
- FP-695: Data Files Events and Notification Toasts

### Changed

- FP-597: Swap Alert component to Message in applications
- FP-427: Apps Metadata Port
- FP-806: Workbench Config
- FP-604: Remove "close" buttons from modals with X button

### Fixed

- FP-371: Fix File Preview
- FP-363: Consistent Header Templates
- FP-601: Correct color of back button in file navigation

## [2.2.0] - 2020-12-01: User Onboarding; Feedback

### Added

- FP-764: Add User Onboarding (#225)
- FP-186: Feedback link (#201)
- FP-773: Port projects backend and convert unit tests to Pytest (#252)
- FP-652: Add welcome messages to Manage Account and Unauthenticated User Ticket Page (#231)
- FP-772: UI pill component (#232)

### Changed

- FP-299: Use Python Poetry to manage dependencies (#51)
- FP-639: Message component updates (#260)
- FP-734: move accounts route under workbench (#226)

### Fixed

- FP-659: Change default blue links in licence modal to purple (#229)
- FP-629: Apply color signifying ticket responder to date and name (#233)
- FP-401: Add Formik validation in mkdir/rename modals (#217)
- FP-517: Refactor exception handling in base view (#256)

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

[unreleased]: https://github.com/TACC/Core-Portal/compare/v2.10.0...HEAD
[2.10.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.10.0
[2.9.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.9.0
[2.8.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.8.0
[2.7.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.7.0
[2.6.1]: https://github.com/TACC/Core-Portal/releases/tag/v2.6.1
[2.6.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.6.0
[2.5.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.5.0
[2.4.2]: https://github.com/TACC/Core-Portal/releases/tag/v2.4.2
[2.4.1]: https://github.com/TACC/Core-Portal/releases/tag/v2.4.1
[2.4.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.4.0
[2.3.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.3.0
[2.2.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.2.0
[2.1.2]: https://github.com/TACC/Core-Portal/releases/tag/v2.1.2
[2.1.1]: https://github.com/TACC/Core-Portal/releases/tag/v2.1.1
[2.1.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.1.0
[2.0.1]: https://github.com/TACC/Core-Portal/releases/tag/v2.0.1
[2.0.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.0.0
[1.1.0]: https://github.com/TACC/Core-Portal/releases/tag/v1.1.0
[1.0.0]: https://github.com/TACC/Core-Portal/releases/tag/v1.0.0
