export type TParameterSetNotes = {
  isHidden?: boolean;
  fieldType?: string;
  inputType?: string;
  validator?: {
    regex: string;
    message: string;
  };
  enum_values?: [{ [dynamic: string]: string }];
  label?: string;
};

export type TJobArgSpec = {
  name: string;
  arg?: string;
  description?: string;
  include?: boolean;
  notes?: TParameterSetNotes;
};

export type TAppArgSpec = {
  name: string;
  arg?: string;
  description?: string;
  inputMode?: string;
  notes?: TParameterSetNotes;
};

export type TJobKeyValuePair = {
  key: string;
  value: string;
  description?: string;
  inputMode?: string;
  notes?: TParameterSetNotes;
};

export type TJobArgSpecs = TJobArgSpec[];

export type TAppFileInput = {
  name?: string;
  description?: string;
  inputMode?: string;
  envKey?: string;
  autoMountLocal?: boolean;
  notes?: {
    showTargetPath?: boolean;
    isHidden?: boolean;
    selectionMode?: string;
  };
  sourceUrl?: string;
  targetPath?: string;
};

export type TTapisApp = {
  sharedAppCtx: string;
  isPublic: boolean;
  sharedWithUsers: string[];
  tenant: string;
  id: string;
  version: string;
  description: string;
  owner: string;
  enabled: boolean;
  locked: boolean;
  runtime: string;
  runtimeVersion?: string;
  runtimeOptions: string[];
  containerImage: string;
  jobType: string;
  maxJobs: number;
  maxJobsPerUser: number;
  strictFileInputs: boolean;
  jobAttributes: {
    description?: string;
    dynamicExecSystem: boolean;
    execSystemConstraints?: string[];
    execSystemId: string;
    execSystemExecDir: string;
    execSystemInputDir: string;
    execSystemOutputDir: string;
    execSystemLogicalQueue: string;
    archiveSystemId: string;
    archiveSystemDir: string;
    archiveOnAppError: boolean;
    isMpi: boolean;
    mpiCmd: string;
    cmdPrefix?: string;
    parameterSet: {
      appArgs: TAppArgSpec[];
      containerArgs: TAppArgSpec[];
      schedulerOptions: TAppArgSpec[];
      envVariables: TJobKeyValuePair[];
      archiveFilter: {
        includes: string[];
        excludes: string[];
        includeLaunchFiles: boolean;
      };
      logConfig: {
        stdoutFilename: string;
        stderrFilename: string;
      };
    };
    fileInputs: TAppFileInput[];
    fileInputArrays: [];
    nodeCount: number;
    coresPerNode: number;
    memoryMB: number;
    maxMinutes: number;
    subscriptions: [];
    tags: string[];
  };
  tags: string[];
  notes: {
    label?: string;
    shortLabel?: string;
    helpUrl?: string;
    category?: string;
    isInteractive?: boolean;
    hideNodeCountAndCoresPerNode?: boolean;
    icon?: string;
    dynamicExecSystems?: string[];
    queueFilter?: string[];
    hideQueue?: boolean;
    hideAllocation?: boolean;
    hideMaxMinutes?: boolean;
    jobLaunchDescription?: string;
    showReservation?: boolean;
  };
  uuid: string;
  deleted: boolean;
  created: string;
  updated: string;
};

export type TPortalApp = {
  loading: boolean;
  error: {};
  definition: TTapisApp;
  systemNeedsKeys: boolean;
  pushKeysSystem: {};
  execSystems: TTapisSystem[];
  license: {
    type: string;
    enabled: boolean;
  };
  appListing: {}[];
};

export type TTasAllocationDetails = {
  computeAllocated: number;
  computeRequested: number;
  computeUsed: number;
  dateRequested: string;
  dateReviewed: string | null;
  decisionSummary: string | null;
  end: string;
  id: number;
  justification: string;
  memoryAllocated: number;
  memoryRequested: number;
  project: string;
  projectId: number;
  requestor: string;
  requestorId: number;
  resource: string;
  resourceId: number;
  reviewer: string | null;
  reviewerId: number;
  start: string;
  status: string;
  storageAllocated: number;
  storageRequested: number;
};

export type TTasAllocatedSystem = {
  allocation: TTasAllocationDetails;
  host: string;
  name: string;
  type: string;
};

export type TTasAllocation = {
  pi: string;
  projectId: number;
  projectName: string;
  title: string;
  systems: TTasAllocatedSystem[];
};

export type TUserAllocations = {
  active: TTasAllocation[];
  inactive: TTasAllocation[];
  hosts: {
    [key: string]: string[];
  };
  portal_alloc: string;
};

export type TTapisJob = {
  appId: string;
  appVersion: string;
  archiveCorrelationId?: string;
  archiveOnAppError: boolean;
  archiveSystemDir: string;
  archiveSystemId: string;
  archiveTransactionId?: string;
  blockedCount: number;
  cmdPrefix?: string;
  condition: string;
  coresPerNode: number;
  created: string;
  createdby: string;
  createdbyTenant: string;
  description: string;
  dtnInputCorrelationId?: string;
  dtnInputTransactionId?: string;
  dtnOutputCorrelationId?: string;
  dtnOutputTransactionId?: string;
  dtnSystemId?: string;
  dtnSystemInputDir?: string;
  dtnSystemOutputDir?: string;
  dynamicExecSystem: boolean;
  ended: string;
  execSystemConstraints?: string;
  execSystemExecDir: string;
  execSystemId: string;
  execSystemInputDir: string;
  execSystemLogicalQueue: string;
  execSystemOutputDir: string;
  fileInputs: string;
  id: number;
  inputCorrelationId: string;
  inputTransactionId: string;
  isMpi: boolean;
  jobType: string;
  lastMessage: string;
  lastUpdated: string;
  maxMinutes: number;
  memoryMB: number;
  mpiCmd?: string;
  name: string;
  nodeCount: number;
  notes: string;
  owner: string;
  parameterSet: string;
  remoteChecksFailed: number;
  remoteChecksSuccess: number;
  remoteEnded?: string;
  remoteJobId?: string;
  remoteJobId2?: string;
  remoteLastStatusCheck?: string;
  remoteOutcome?: string;
  remoteQueue?: string;
  remoteResultInfo?: string;
  remoteStarted?: string;
  remoteSubmitRetries: number;
  remoteSubmitted?: string;
  sharedAppCtx: string;
  sharedAppCtxAttribs: string[];
  stageAppCorrelationId?: string;
  stageAppTransactionId?: string;
  status: string;
  subscriptions: string;
  tags: string[] | null;
  tapisQueue: string;
  tenant: string;
  uuid: string;
  visible: boolean;
  _fileInputsSpec?: string;
  _parameterSetModel?: string;
};

export type TTapisSystemQueue = {
  name: string;
  hpcQueueName: string;
  maxJobs: number;
  maxJobsPerUser: number;
  minNodeCount: number;
  maxNodeCount: number;
  minCoresPerNode: number;
  maxCoresPerNode: number;
  minMemoryMB: number;
  maxMemoryMB: number;
  minMinutes: number;
  maxMinutes: number;
};

export type TTapisSystem = {
  isPublic: boolean;
  isDynamicEffectiveUser: boolean;
  sharedWithUsers: [];
  tenant: string;
  id: string;
  description: string;
  systemType: string;
  owner: string;
  host: string;
  enabled: boolean;
  effectiveUserId: string;
  defaultAuthnMethod: string;
  authnCredential?: object;
  bucketName?: string;
  rootDir: string;
  port: number;
  useProxy: boolean;
  proxyHost?: string;
  proxyPort: number;
  dtnSystemId?: string;
  dtnMountPoint?: string;
  dtnMountSourcePath?: string;
  isDtn: boolean;
  canExec: boolean;
  canRunBatch: boolean;
  enableCmdPrefix: boolean;
  mpiCmd?: string;
  jobRuntimes: [
    {
      runtimeType: string;
      version?: string;
    }
  ];
  jobWorkingDir: string;
  jobEnvVariables: [];
  jobMaxJobs: number;
  jobMaxJobsPerUser: number;
  batchScheduler: string;
  batchLogicalQueues: TTapisSystemQueue[];
  batchDefaultLogicalQueue: string;
  batchSchedulerProfile: string;
  jobCapabilities: [];
  tags: [];
  notes: {
    label?: string;
    keyservice?: boolean;
    isMyData?: boolean;
    hasWork?: boolean;
    portalNames: string[];
  };
  importRefId?: string;
  uuid: string;
  allowChildren: boolean;
  parentId?: string;
  deleted: boolean;
  created: string;
  updated: string;
};

export type TPortalSystem = {
  name: string;
  system: string;
  scheme: string;
  api: string;
  homeDir: string;
  icon: string | null;
  default: boolean;
};

export type TTapisFile = {
  system: string;
  name: string;
  path: string;
  format: 'folder' | 'raw';
  type: 'dir' | 'file';
  mimeType: string;
  lastModified: string;
  length: number;
  permissions: string;
  doi?: string;
  scheme?: string;
  api?: string;
};
