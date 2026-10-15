export type TProfileDemographics = {
  id: number;
  user: number;
  setup_complete: boolean;
  institution: string;
  orcid_id?: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  institutionId: number;
  department: string;
  departmentId: number;
  citizenship: string;
  citizenshipId: number;
  source: string;
  uid: number;
  homeDirectory: string;
  gid: number;
  orcidId?: string;
};

export type TProfileHistoryItem = {
  status: string;
  timestamp: string;
  actor: string;
  comment: string;
};

export type TProfileLicense = {
  license_type: string;
  class: string;
  details_html: string;
  template_html: string;
  current_user_license?: boolean; // true if user has license, null otherwise
};

export type TProfileIntegration = {
  label: string;
  activated: string;
  connect: string;
  disconnect: string;
  error: string;
};

export type TProfileResponse = {
  demographics: TProfileDemographics;
  history: TProfileHistoryItem[];
  licenses: TProfileLicense[];
  integrations: TProfileIntegration[];
};
