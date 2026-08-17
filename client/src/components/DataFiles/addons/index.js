import DataFilesUploadModalAddon from './DataFilesUploadModalAddon/DataFilesUploadModalAddon';
import DataFilesAddProjectModalAddon from './DataFilesAddProjectModalAddon/DataFilesAddProjectModalAddon';
import DataFilesProjectEditDescriptionModalAddon from './DataFilesProjectEditDescriptionModalAddon/DataFilesProjectEditDescriptionModalAddon';
import DataFilesPreviewModalAddon from './DataFilesPreviewModalAddon/DataFilesPreviewModalAddon';
import DataFilesProjectFileListingAddon from './DataFilesProjectFileListingAddon/DataFilesProjectFileListingAddon';
import DataFilesProjectFileListingMetadataAddon from './DataFilesProjectFileListingMetadataAddon/DataFilesProjectFileListingMetadataAddon';
import DataFilesProjectFileListingMetadataTitleAddon from './DataFilesProjectFileListingMetadataTitleAddon/DataFilesProjectFileListingMetadataTitleAddon';
import DataFilesManageProjectModalAddon from './DataFilesManageProjectModalAddon/DataFilesManageProjectModalAddon';
import DataFilesProjectTree from './DataFilesProjectTree/DataFilesProjectTree';

/**
 * Core default addon components for metadata-enabled portals,
 * keyed by addon name.
 *
 * `useAddonComponents` resolves each addon a portal requests to its
 * `_custom/<portal>/<name>` override if present, otherwise to the default
 * here. A portal can list an addon name in its workbench config and get the
 * default with no custom file; it only ships a `_custom` file to override.
 */
const coreMetadataAddons = {
  DataFilesUploadModalAddon,
  DataFilesAddProjectModalAddon,
  DataFilesProjectEditDescriptionModalAddon,
  DataFilesPreviewModalAddon,
  DataFilesProjectFileListingAddon,
  DataFilesProjectFileListingMetadataAddon,
  DataFilesProjectFileListingMetadataTitleAddon,
  DataFilesManageProjectModalAddon,
  DataFilesProjectTree,
};

export default coreMetadataAddons;
