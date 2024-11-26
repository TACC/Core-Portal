# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [3.10.0]

### Added

deps/react-18: Update React to v18 by @jarosenb in #979
Bug/WP-50: Fix sizing of buttons "as-link" by @jmcmillenmusic in #986
Task/WP-509: Handle file/folder download feature with large number of files by @jmcmillenmusic in #981
Task/WP-520: AppTray should use versionEnabled for list of apps instead of enabled by @jmcmillenmusic in #991
Bug/WP-24: Disabling Google Drive Integration by @jalowe13 in #988
WP-730: Refactor useRename to use react-query by @jarosenb in #993
Task/WP-728: Mutation hook: Copy file by @jalowe13 in #1000
Task/WP-78: V3 Shared Workspaces Tests by @jalowe13 in #987

### Fixed

Bug/WP-419 Public Data Header Left Margin by @jalowe13 in #1003
WP-765: Fix job status button to show background by @chandra-tacc in #1015


## [3.9.0]

### Fixed

- WP-53: Rename loading status fix (#980)
- WP-417: Onboarding User List Alternating Color (#985)
- WP-420: Search placeholder does not update on navigating to directories (#989)
- WP-265 and WP-266 - tickets tests js warnings (#975)
- WP-261: Search bar component - fix js warnings related to button usage (#974)
- WP-76: Add unit tests for /api/accounts/systems/ route (#984)
- WP-267: JS Warnings: Adjust button usage and pass in required fields (#973)
- WP-701: ProjectId can be optional in DataFilesProjectMembers component (#976)

### Deps

- bump werkzeug from 3.0.3 to 3.0.6 in /server (#990)
- bump django from 4.2.15 to 4.2.16 in /server (#982)


## [3.8.2]

### Added

- WP-371: Use set-facl job for workspace ACLs (#967, #968)

### Fixed

- WP-573: User unable to login when group checks fail (#962)

## [3.8.1]

### Fixed

- Cron indexer should use home dir as root instead of '/' (#963)
- WP-677: Dynamic exec system bug fixes - validation and allocation list  (#964)

## [3.8.0]

### Added
WP-594: Setup internal docs with login access (#959)
WP-80: Implement dynamic execution system selection (#921)
WP-190: Handle concurrency with Tapis OAuth Token Refresh (#932)

### Fixed

- WP-585: TAS API: Country of Residence is no longer available.(#955)
- WP-553: Search index cron tab fixes (#948)

## [3.7.0]

### Fixed

- WP-549: Handle validation for FORK job type (#946)
- WP-551: use only strings for app arguments (#948)

## [3.6.1]

### Fixed

- Add Stampede3 to allocation list and system monitor list (#943)
- WP-547: case insensitive email in GET tickets (#944)

## [3.6.0]

### Fixed

- Fix and enable shared workspaces unit test (#927)
- WP-305: Do not encode sourceUrl field for tapis jobs (#929)
- WP-409: Set members to superuser via TAS (#931)
- Quick: update node to LTS (20.x), GH actions, and resolve security alerts (#940)
- Quick: update poetry to 1.8.2 (#941)
- Quick: add untracked migrations (#939)

## [3.5.0]

### Added

- WP-358: sort apps inside category before rendering (#914)
- WP-367: Adding Public Data CMS Nav (#918)
- WI-15: Add health check for site status (#919)

### Fixed

- WP-59: Reload app page after every navigation (#920)
- WP-398: 'Preview File' button should say 'Download File'(#924)
- WP-47: fix shared workspace manage team modal (#922)
- WP-379: Error handling for site search results (#925)
- WP-97: Fix TestAgaveUtils#test_walk_levels (#926)


## [3.4.3] - 2023-12-11: Fix push key handling
### Fixed

- WP-408: use archiveSystemId set in app definition as default (#917)


## [3.4.2] - 2023-12-07: Fix push key handling
### Fixed

- WP-402: handle 401 unauthorized Tapis error for pushing keys (#915, #916)

## [3.4.1] - 2023-12-05: Fix web hook and impersonation bug
### Fixed

- WP-400: Fix impersonate url (#912)
- Bug: Fix websockets via ASGI_APPLICATION setting (#913)


## [3.4.0] - 2023-11-27: Django upgrade to 4 and bug fixes
### Changed

- WP-271: Upgrade Django to 4.2 and update other 3rd party dependencies (#895) 
- WP-320: No new tab when downloading files from My Data (#900)
- WP-388: Handle text overflow on longer system labels(systemName) (#901)

### Fixed

- User impersonation url fix (#902)
- WP-104: phantom entry in ViewTab when user removed (#884)
- WP-287: Remove login url redirect to profile data
- WP-390: Fix Public Data View (#903)
- Projects Search: Handle Scenario where Id is missing (#899)
  
## [3.3.2] - 2023-11-09: workspace search fails on frontera portal
- WP-380: Remove id prefix filter on workspace search (#898)
  
## [3.3.1] - 2023-11-07: Search related bug fixes and App Icon fix
- WP-355: Fixing issue with icons on dev/prod sites (#892)
- WP-354: Workspace search - filter results visible to user (#893)
- WP-356: Site Search: For files, use home dir to isolate the search (#897)
- WP-361: Jobs Search - restrict search to a specific portal (#896)

## [3.3.0] - 2023-10-27: V3 integration improvements; bug fixes

### Added

- WP-164 Implement Workspace Search (#886)
- WP-288: Implement Queue Filter for V3 apps (#883)
- WP-100: Display all Job Attributes in Jobs History > View Details (#868)
- WP-72: Workspace Search - Highlight matching search terms (#873)
- WP-273: App Category icon (#874)
- WP-32: Ability to see incomplete onboarding status in onboarding page. (#891)

### Changed

- WP-299: Add Data Files button dropdown needs minor adjustment in alignment (#878)
- WP-65: Data Files: Display full paths for concatenated breadcrumbs or filepaths (#866)
- WP-278: Data Files: Update Design of View Path Modal (#866)
- WP-279: Data Files: Support <TextCopyField> That Can Show All Text (#866)

### Fixed
- WA-314: Input file fixes for hidden and FIXED types (#880)
- WP-66: Refactor DataFiles components to have more descriptive prop and variable names (#885 and #876)
- WP-109-remove-unused-django-fields  (#887)
- Fix email confirmation for tickets (#879)

## [3.2.1] - 2023-10-05: Search and Target Path fixes

### Fixed
WP-297: Fix site search for public and community data (#870)
WP-306: Fix target path regression (#871)

## [3.2.0] - 2023-10-02: V3 integration improvements; bug fixes

### Added

- WP-211: App Form updates to allow target path (#857)
- WP-272: Include username in Onboarding Admin user listing (#861)

### Changed

- WP-189 Handle timeout exit code for interactive app jobs (#851)
- WP-163 Compress Archive Path Fix (#846) 
- WP-105: create common utils function (#850) 
- WP-172: Minimize unit test warnings (#855)
- WP-62: Changed upload function to use TAPIS file insert api (#859)

### Fixed
- WP-249 Shared Workspace Copy Bug Fix (#858)
- WP-262 Workspace file operations bug fixes (#862)
- WP-276: Fixed Data Files Add button dropdown off-centered UI (#863)
- Quick: handle missing default system; enable work as default system locally (#867)
- WP-52 Jobs View Infinite Scroll Fix (#865)
- WP-228: Fixed sorting for system list (#860)
- WP-209: fix deprecated warnings (part II) (#852)


## [3.1.2] - 2023-08-22: Secure user search endpoint

### Fixed

- Prevent user search endpoint from returning all user profiles (#848)

## [3.1.1] - 2023-08-16: Fix Files Search Scope

### Fixed

- WP-230: Prevent other users' files from appearing in search results (#847)

## [3.1.0] - 2023-08-03: v3 model adjustments; bugfixes; core-styles update

### Added

- WP-75: Implement cancel job action (#842)

### Changed

- WI-29: Setup Django Caching (#828)
- WP-43: System Monitor UI Update (#807)
- Quick: handle 3dem workspace migrations (#833)
- TV3-164: Remove 10 second system credential delay (#840)
- WP-171: Address deprecation warnings in backend (urls and gettext_lazy) (#838)
- WP-208: Do not squash Tapipy exceptions in BaseApiException (#834)
- WP-193: core-stlyes update (#837)

### Fixed

- WP-38: Prevent multiple clicks to button, add spinner (#819)
- docs: fix bad desc of branch prefix "style" (#822)
- fix:(ui-patterns): show actual class name passed (#663)
- WP-40: Prevent push keys message and modal for key service systems (#830)
- Quick: Correctly hide "Parameters" string in app form if none exist (#832)
- WP-45: Fix Sysmon blank fields for unoperational systems (#841)
- WP-194: Filter out readonly parameters and file inputs from job submission (#843)

### Removed

- TV3-139: Cleanup Old Systems Code (#817)

## [3.0.1] - 2023-06-29: Fix Onboarding Websockets

### Changed

- Update pull_request_template.md

### Fixed

- fix(docker): use latest not tapisv3 image (#818)
- Fix SetupEvent not sending websocket notifications (#820)

## [3.0.0] - 2023-06-26: Tapis v3; Upgrade Django to 3.2

### Added

- TV3-143: Shared Workspace migration scripts (#803)
- TV3-175: token endpoint (#809)
- TV3-155, TV3-156: Customizable Tapis v2 Jobs View (#789)
- TV3-78: Tapis v3 import-apps util (#786)
- TV3-105: Historical jobs in V3 (#744)
- FP-319: Job History Search (#756)
- TV3-55: Job (re)submission backend (#734)

### Changed

- Update Readme (#814), (#815)
- TV3-176: Revised parameterSet view in AppForm (#812)
- TV3-173, TV3-174: Regex validation; Dynamic parameterSet (#810)
- TV3-92: support field type from notes in app definition (#802)
- TV3-162: Upgrade Django to 3.2 (#798)
- TV3-169: Replace tapis profile info with TAS info (#801)
- TV3-167: Update TODOv3 comments (#796)
- TV3-166: Remove Defuct/Unused Settings (#794), (#776)
- TV3-161: Shared Workspaces Push Keys (#790)
- TV3-157: No longer save ssh keypairs in database (#788)
- TV3-47: Tapis v3 Search (#781)
- TV3-129: Update Request New Allocation Link (#784)
- TV3-130: manage account changes (#782)
- TV3-25: Tapis v3 Shared Workspaces (#771)
- TV3-79: Tapis v3 Postits (#775)
- TV3-87: Tapis v3 Compress/Extract Toolbar Utility Apps (#774)
- TV3-43: Tapis v3 Files Handler (#769)
- TV3-125: Remove Feedback link (#773)
- TV3-137: Queue validation for v3 systems (#770)
- TV3-109 Concatenate homeDir in DataFiles Breadcrumbs (#765)
- TV3-98: enable app unit tests (#768)
- TV3-102: Implement relative homeDir listings for Data Files systems (#755)
- TV3-44: Tapis v3 Notifications (#745)
- TV3-82: Tapis v3 Push Keys (#739)
- Tapis v3 long-live client (#747)
- TV3-51: Tapis v3 app form frontend (#730)
- TV3-57: Replace JobSubmission model with tags (#736)
- TV3-80: update token refresh middleware (#732)
- TV3-67: Tapis v3 App licenses (#726)
- TV3-52: Tapis v3 Systems Onboarding (#713)
- TV3-42: Tapis v3 Jobs Listing (#705)
- TV3-70: Tapis v3 Apps Tray (#720)
- TV3-50: Tapis v3 apps operations (#711)
- TV3-2: Tapis v3 Auth (#664)

### Fixed

- TV3-168: Tapis Client UI Delay (#804)
- TV3-141, TV3-171: Fix Navigation in Copy/Move Modal & Incorrect System Names (#793)
- TV3-172: Prevent excessive refetching of user roles (#805)
- TV3-152: Fix workspace jupyter mounts (#800)
- WP-46: Fix Filter Inconsistencies (#795)
- TV3-163: Add 10s delay to workaround tapis-issue (#791)
- TV3-154: Treat 500 errors from file listings as need for keys (#787)
- TV3-107, TV3-120: Fix incorrect and missing systems (#767)
- TV3-102: Properly Handle Job Output (#760)

## [2.24.0] - 2023-06-22: Bugfixes; BM preview; Custom stylesheets

### Added

- BM-45: Add preview for Brainmap files (.nii, .nii.gz) (#772)
- Allow per-project portal stylesheets (#799)

### Changed

- FP-1986: Restrict APCD submissions access (#766)
- Update local CA certs (#783)
- Remove Maverick from sysmon and from sysmon fixtures (#808)

### Fixed

- FP-1952: tighter ES network settings (#752)
- Pin cms version; update cms settings; fix es_domain (#759)
- Remove Data Submissions from Sidebar (#761)
- FP-1986: Restrict APCD submissions access (#766)
- WI-39: remove MFAStep from onboarding (#811)

## [2.23.0] - 2023-01-18: Minor changes and bugfixes

### Changed

- FP-1951: Configurable Ticket Attachment Size (#754)
- FP-1939: Cleanup searchbar and sidebar components (#737)
- FP-1943: Remove retired Longhorn from system monitor (#738)
- TV3-93: Tapis v2 verbose historical job data (#748)

### Fixed

- FP-1928: Fix Data Files Dropdown CSS (#735)

## [2.22.1] - 2022-11-15: Increase CustomMessageTemplate length

### Fixed

- FP-1922: Increase CustomMessageTemplate max_length to 1000 characters

## [2.22.0] - 2022-11-15: Common Searchbar; Common Sidebar; TAP Sysmon

### Added

- FP-1902: Common Searchbar component (#724)

### Changed

- FP-1839: Feedback link in portal is configurable (#707)
- FP-1537: Download modal adjustments (#716)
- FP-1877: Replace alert with inline (#717)
- FP-1886: Remove My Account from pulldown at the top right (#723)
- Quick: Move prettier config to .prettierrc file (#725)
- FP-1901: Replace system monitor endpoint with TAP (#729)
- FP-1560: Use _common Sidebar (#731)

### Fixed

- FP-1668: Added () to accepted characters and changed error message to reflect (#709)
- FP-1669: Fix back button in copy modal (#710)
- FP-1859: Fix upload icon color (#714)
- FP-1584: Populating source portal name in ticket data (#718)
- FP-1629: Allow helper text to display with error message while creating a job (#719)
- FP-1861: Remove app icon underline on hover (#721)
- FP-1860: Match css text color for 'Up to 500mb' text (#728)

## [2.21.0] - 2022-10-06: Bugfixes for Allocations, Systems, Roles

### Changed
- FP-267: Reconfigure local dev to use cep.test (#697)
- Use codecov github action instead of deprecated bash script (#703)
- FP-1856: update xras link for requesting new allocations (#700)

### Fixed
- FP-1823: Update poetry and base docker image (#695)
- FP-1829: Add lonestar6 to list of known tacc systems (#696)
- FP-1836: Fix SystemPushKeysModal (#699)
- FP-1729: Apply user roles to "Edit Descriptions" and "Add" Files buttons (#692)
- FP-1855: Fix allocation usage dialog (#701)
- FP-1870: Fix LS6 home dir #706

## [2.20.0] - 2022-09-08: APCD Portal; Delegate Management; Common Button

### Added
- FP-1759: Data Submission (#683)
- FP-1788: APCD Manage Account (#688)
- FP-1591: Add pytorch icon for pytorch resnet frontera app (#686)
- FP-1639: Delegate management (#679)

### Changed
- FP-546: Use _common Button (#662)
- FP-1769: Hide empty System Monitor if there are no systems to list (#685)
- FP-1783: Editable welcome message (#684)
- FP-1760: APCD project membership (#680)
- docs(ui): less specific primary button use case (#676)

### Fixed
- FP-1784: Remove user-guide link from feedback modal (#687)
- FP-1772: Allocations Modal bugfixes (#682)

## [2.19.0] - 2022-07-14: Core-Styles; TAP Functions; Bugfixes

### Changed

- TUP-271: Use Core-Styles from TUP UI (#651)
- Bump lxml from 4.6.5 to 4.9.1 in /server (#671)
- docs(README): do not mention webpack (#668)
- FP-1633: Alter webhook and job name to use new tap functions (#669)

### Fixed

- FP-1694: Fix background icon in FileInputDropdownSelector (#667)
- FP-1696: Manage Team modal bugfixes (#672)
- FP-1722: Fix Shared Workspaces id and accept any amount of hyphens in PORTAL_PROJECTS_ID_PREFIX (#673)

## [2.18.1] - 2022-07-06: Hotfix: Fix `fetchUtil`

### Fixed

- FP-1715: Fix `fetchUtil` (#670)

## [2.18.0] - 2022-06-28: Manage Allocations

### Added

- FP-737: Manage Allocations (#568)
- FP-1650: Test Cases for _common/Button (#640)

### Fixed

- FP-1702: CSS Load Order Differs on Dev vs Local (#665)
- FP-1539: Fix Undesired `<Pill>` truncation (#666)

## [2.17.0] - 2022-06-14: Admin Messages; Member Roles for Shared Workspaces

### Added

- FP-1643: Toggle allocations setting (#643)
- FP-1534: Cortal v1.4 (#632)
- FP-1375: Admin controlled messages (#615)

### Changed

- FP-1653: Order onboarding admin view users by date_joined, descending (#642)
- FP-1647: Use Core-Styles (#639)
- FP-1596: Pagination Using Button Component (#631)
- FP-1131: Add Member role to shared workspace (frontend) (#597)

### Fixed

- FP-1677: Update (Fix) Button Styles (#654)
- Fix Allocations Table Cell Content Alignment (#648)
- FP-1321: Reindex job archive path. (#644)

## [2.16.0] - 2022-05-17: Hook library; Dynamic App Form Updates; Styling

### Added

- FP-1384: Hook library for Data Files (#553)

### Changed

- Clean up FP-1082 & Prep for FP-1613 (#627)
- Bump django from 2.2.27 to 2.2.28 in /server (#629)
- FP-990 & FP-1255: Update <IntroMessage> to Use Dismissible <SectionMessage> (#616)
- FP-1194: CMS Samples: Update Secrets, Add Settings (#522)
- FP-1628: Update app values when user changes a new queue (#638)
- FP-1491: Style _common Button React Component (#598)

### Fixed

- FP-1543: No Small Primary Buttons (even in Header) (#628)
- FP-1567: Toolbar state not refreshing when moving to shared workspaces ProjectsList (#619)
- Add prettier check/fix commands (#633)
- FP-1566: fix early search results display (#634)
- FP-1618, FP-1626, FP-1630, FP-1299: Various bugfixes (#630)
- FP-1638: Add fixed widths for icon and date in Jobs table (#635)

## [2.15.0] - 2022-04-19: Common Sidebar; Bugfixes

### Added

- FP-86: Create common Sidebar (#610)

### Changed

- FP-1543: "Add Ticket" Link → "New Ticket" Button (#623)
- FP-1346: Handle errors in accounts views (#614)
- FP-1563: Update certs for cep.dev local development (#621)

### Fixed

- FP-1538: Remove hover highlight for DataFilesTable headers. (#618)
- FP-1352 fix linting (#622)
- FP-1572: Fix UI overflow (#626)
- Bump minimist from 1.2.5 to 1.2.6 in /client (#620)
- Bump twisted from 22.2.0 to 22.4.0 in /server (#625)
- Bump paramiko from 2.9.2 to 2.10.1 in /server (#617)
- Bump poetry from 0.12 to 1.1.0 in /server (#613)

## [2.14.0] - 2022-03-22: Hidden Data Files Systems; Security Updates; Bugfixes

### Added

- FP-1311: Loading Icon for _common Button React Component (#603)
- FP-1541: [A2CPS] Add hidden flag option to data files storage systems (#608)

### Changed

- FP-1533: [A2CPS] Use User Client for SystemCreationStep (#607)
- FP-1549: Update node to LTS (v16.x) (#611)

### Fixed

- FP-1154: Copy Modal default destination storage system fix (#570)
- FP-1528: Recursive indexer deletes documents it shouldn't (#599)
- FP-1339: Ticket Attachment Cell Hover Underlines When Not over Link (#602)
- FP-1536: Paginator endcaps have different styles (#604)
- FP-1540: Hotfix: Update ES to Fix Security Issue (#606)
- FP-1430: Output location disappears after clicking on View details link (#609)

## [2.13.0] - 2022-02-24: Component Design Enhancements; Onboarding and other bugfixes

### Changed

- - FP-200: Trash Modal: Official Design (#549)
- FP-545: Create _common Button React Component (#584)

### Fixed

- FP-1479: Site Search WEB results should be purple (#587)
- FP-1460: Resolve dependabot alerts (#588)
- FP-1503: Fix onboarding; Remove unnecessary FETCH_AUTHENTICATED_USER dispatch (#595)
- FP-1428: Fix job history error (#589)
- FP-1514: Fix project membership step to handle allocation-less projects (#596)

## [2.12.1] - 2022-01-18: Fix anonymous views

### Fixed

- FP-1447: handle anonymous users in data context (#580)

## [2.12.0] - 2022-01-04: Vite Migration; Request Access Page; Relaunch Jobs; ARIA and other bugfixes

### Added

- FP-1257: Frontend builds using Vite (#520)
- FP-1219: Request Access Page (#538)
- FP-547: Relaunch jobs in Job History modal. (#552)
- FP-1146: Enable recaptcha for unauthenticated feedback or tickets (#530)

### Changed

- FP-1325: Add notice to Data Depot (#575)
- FP-1385: Add ARIA label to Data Files checkboxes for accessibility (#574)
- FP-1090: Put welcome message visited status in database, not localStorage (#545)
- FP-1250: Add and enable new app icons (#558)
- FP-1294: Toggle Site Search Systems (#571)
- FP-1262: Match HTML Checkbox Behavior for Data Files (#554)
- FP-1350: Add phone validation tests (#557)
- FP-357: Keyboard A11y - Ticket navigation and open/close with keyboard (#567)
- FP-1106: Move Make Public button to copy modal (#531)

### Fixed

- FP-1395: Fix recaptcha bugs (#573)
- FP-1347: Fix Ticket Attachment Space Discrepancies (#569)
- FP-1373: Data Files Filter Updates (#556)
- FP-1386: Make CheckboxHeaderCell keyboard accessible (#563)
- FP-1420, FP-1425: Fix non-persistent Welcome Message state; Fix Orcid ID link (#578)
- FP-1429: Fix styling on 'Resubmit Job' button (#579)

## [2.11.1] - 2021-11-18: ES Indexer and job validation hotfixes

### Fixed

- FP-1362: Make hideSearchBar param optional on systems (#550)
- BM-24: Fix job validation when maxNodes > processorsPerNode (#551)

## [2.11.0] - 2021-11-15: Bugfixes; UI Improvements

### Changed

- FP-181 Download Attachments in Ticket history (#517)
- FP-1251: Shorten "Principal Investigator" to "PI" in Allocations view (#519)
- FP-1258: Enable html and large file previews (#521)
- FP-1130: Remove unused systemPrefix workbench settings (#512)
- FP-1212: Use Download Modal for Multiple Files (#515)
- FP-1236: Support multiple RT service accounts (#523)
- FP-822: Batch notifications after move/copy/upload (#504)
- FP-1248: Replace underscores in usernames when cloning/retrieving cloned exec system (#525)
- FP-1308: Update README for server testing (#532)
- FP-1307: Update ticket attachment design (#542)
- FP-1079: Catch when a system is down for maintenance and alert user (#526)
- FP-1264: Added hover effect to Data Files (#536)
- FP-1166: Handle users who have no allocations (#537)
- BM-21: Add project request queue setting (#539)
- FP-180: List file names of attachments in Ticket history (#509)
- FP-757: Close modals after success (#511)
- FP-1197: Add unit test for DataFilesTable (#524)
- FP-1155: Apply search filters on backend  using Elasticsearch (#516)

### Fixed

- FP-1003: Update Shared Workspace breadcrumb on title change (#505)
- FP-1109: Update Job Status on View Detail and Job Listing (#507)
- FP-1051: Applications: Better downtime message (#501)
- FP-1242: Clarify text when copying between different systems. (#518)
- Hotfix: Fix community data filters and remove 'Back to All Files' in site search (#528)
- FP-1100: system creation failures (#513)
- FP-822: hotfix: display slash instead of empty path (#529)
- FP-1327: Fix onboarding link (#541)
- FP-1292: File listing error handling when network connection failure. (#540)
- Fix indexer exception when no project system to skip (#534)
- FP-1211: Manage Account Section Errors Act like Giant Panels (#543)
- FP-1295: Handle create workspace user error. (#544)
- Fix listing path for shared workspaces in data files modal listings. (#535)
- FP-1002: Manage Account input field Phone validation should match source validation (#533)

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

[unreleased]: https://github.com/TACC/Core-Portal/compare/v3.10.0...HEAD
[3.10.0]: https://github.com/TACC/Core-Portal/releases/tag/v3.10.0
[3.9.0]: https://github.com/TACC/Core-Portal/releases/tag/v3.9.0
[3.8.2]: https://github.com/TACC/Core-Portal/releases/tag/v3.8.2
[3.8.1]: https://github.com/TACC/Core-Portal/releases/tag/v3.8.1
[3.8.0]: https://github.com/TACC/Core-Portal/releases/tag/v3.8.0
[3.7.0]: https://github.com/TACC/Core-Portal/releases/tag/v3.7.0
[3.6.1]: https://github.com/TACC/Core-Portal/releases/tag/v3.6.1
[3.6.0]: https://github.com/TACC/Core-Portal/releases/tag/v3.6.0
[3.5.0]: https://github.com/TACC/Core-Portal/releases/tag/v3.5.0
[3.4.3]: https://github.com/TACC/Core-Portal/releases/tag/v3.4.3
[3.4.2]: https://github.com/TACC/Core-Portal/releases/tag/v3.4.2
[3.4.1]: https://github.com/TACC/Core-Portal/releases/tag/v3.4.1
[3.4.0]: https://github.com/TACC/Core-Portal/releases/tag/v3.4.0
[3.3.2]: https://github.com/TACC/Core-Portal/releases/tag/v3.3.2
[3.3.1]: https://github.com/TACC/Core-Portal/releases/tag/v3.3.1
[3.3.0]: https://github.com/TACC/Core-Portal/releases/tag/v3.3.0
[3.2.1]: https://github.com/TACC/Core-Portal/releases/tag/v3.2.1
[3.2.0]: https://github.com/TACC/Core-Portal/releases/tag/v3.2.0
[3.1.2]: https://github.com/TACC/Core-Portal/releases/tag/v3.1.2
[3.1.1]: https://github.com/TACC/Core-Portal/releases/tag/v3.1.1
[3.1.0]: https://github.com/TACC/Core-Portal/releases/tag/v3.1.0
[3.0.1]: https://github.com/TACC/Core-Portal/releases/tag/v3.0.1
[3.0.0]: https://github.com/TACC/Core-Portal/releases/tag/v3.0.0
[2.24.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.24.0
[2.23.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.23.0
[2.22.1]: https://github.com/TACC/Core-Portal/releases/tag/v2.22.1
[2.22.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.22.0
[2.21.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.21.0
[2.20.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.20.0
[2.19.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.19.0
[2.18.1]: https://github.com/TACC/Core-Portal/releases/tag/v2.18.1
[2.18.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.18.0
[2.17.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.17.0
[2.16.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.16.0
[2.15.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.15.0
[2.14.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.14.0
[2.13.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.13.0
[2.12.1]: https://github.com/TACC/Core-Portal/releases/tag/v2.12.1
[2.12.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.12.0
[2.11.1]: https://github.com/TACC/Core-Portal/releases/tag/v2.11.1
[2.11.0]: https://github.com/TACC/Core-Portal/releases/tag/v2.11.0
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
