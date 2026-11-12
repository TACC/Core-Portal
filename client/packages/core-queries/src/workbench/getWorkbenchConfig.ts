import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '../apiClient';

export type TSidebarLayoutItem = {
  id: string;
  category?: string;
  label?: string;
};

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
  sidebarLayout?: null | TSidebarLayoutItem[];
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

const isText = (v: unknown): v is string =>
  typeof v === 'string' && v.trim() !== '';

const isOptionalText = (v: unknown) => v === undefined || isText(v);

const isSidebarLayoutItem = (item: any): item is TSidebarLayoutItem =>
  isText(item?.id) &&
  isOptionalText(item.category) &&
  isOptionalText(item.label);

function sanitizeSidebarLayout(raw: unknown): TSidebarLayoutItem[] | undefined {
  if (!Array.isArray(raw)) {
    if (raw != null)
      console.warn('sidebarLayout must be an array, ignoring it');
    return undefined;
  }

  const valid = raw.filter((item) => {
    if (isSidebarLayoutItem(item)) return true;
    console.warn('Ignoring invalid sidebarLayout entry', item);
    return false;
  });

  return valid.length > 0 ? valid : undefined;
}

async function getWorkbenchConfig({ signal }: { signal: AbortSignal }) {
  const { data } = await apiClient.get<TWorkbenchResponse>('/api/workbench/', {
    signal,
  });
  const { config } = data.response;

  return {
    ...data.response,
    config: {
      ...config,
      sidebarLayout: sanitizeSidebarLayout(config.sidebarLayout),
    },
  };
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
