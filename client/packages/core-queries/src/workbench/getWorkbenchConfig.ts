import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '../apiClient';

export type TWorkbenchConfig = {
  debug: boolean;
  makeLink: boolean;
  viewPath: boolean;
  compressApp: {
    id: string;
    version: string;
  };
  extractApp: {
    id: string;
    version: string;
  };
  makePublic: boolean;
  hideApps: boolean;
  hideDataFiles: boolean;
  showSubmissions: boolean;
  hideAllocations: boolean;
  hideManageAccount: boolean;
  hideSystemStatus: boolean;
  hasUserGuide: boolean;
  hasCustomSagas: boolean;
  hasCustomEndpoints: boolean;
  hasCustomDataFilesToolbarChecks: boolean;
  addons: string[];
  showDataFileType: boolean;
  onboardingCompleteRedirect: string;
  noPHISystem: string;
  customDashboardSection: null | {
    header: string;
    links: { href: string; text: string }[];
  };
  ticketAttachmentMaxSizeMessage: string;
  ticketAttachmentMaxSize: number;
  jobsv2Title: string;
  trashPath: string;
  showUserNews: boolean;
  projectsEnableMetadata: boolean;
  publisher: string;
  canPublish?: boolean;
  minDescriptionLength?: number;
  maxTitleLength?: number;
  enableWorkspaceKeywords?: boolean;
  uploadModalMaxSizeLabel?: string;
  uploadModalMaxSizeValue?: number;
};

export type TWorkbenchResponse = {
  response: {
    config: TWorkbenchConfig;
    portalName: string;
    recaptchaSiteKey: string;
    isTACCPortal: boolean;
    setupComplete: boolean;
  };
};

async function getWorkbenchConfig({ signal }: { signal: AbortSignal }) {
  const result = await apiClient.get<TWorkbenchResponse>('/api/workbench/', {
    signal,
  });
  return result.data.response;
}

export function getWorkbenchConfigQuery() {
  return queryOptions({
    queryKey: ['workbench'],
    queryFn: ({ signal }) => getWorkbenchConfig({ signal }),
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });
}
