import {
  TTapisSystem,
  TAppFileInput,
  TTapisJob,
  TJobArgSpecs,
  TJobKeyValuePair,
} from 'utils/types';

export type TJobPostOperations = 'resubmitJob' | 'cancelJob' | 'submitJob';

export type TParameterSetSubmit = {
  appArgs?: TJobArgSpecs;
  containerArgs?: TJobArgSpecs;
  schedulerOptions?: TJobArgSpecs;
  envVariables?: TJobKeyValuePair[];
};

export type TConfigurationValues = {
  execSystemId?: string;
  execSystemLogicalQueue?: string;
  maxMinutes?: number;
  nodeCount?: number;
  coresPerNode?: number;
  allocation?: string;
  memoryMB?: number;
  reservation?: string;
};

export type TOutputValues = {
  name: string;
  archiveSystemId?: string;
  archiveSystemDir?: string;
};

export interface TJobSubmit extends TConfigurationValues, TOutputValues {
  archiveOnAppError?: boolean;
  appId: string;
  fileInputs?: TAppFileInput[];
  parameterSet?: TParameterSetSubmit;
}

export type TJobBody = {
  operation?: TJobPostOperations;
  uuid?: string;
  job: TJobSubmit;
  licenseType?: string;
  isInteractive?: boolean;
  execSystemId?: string;
};

export interface IJobPostResponse extends TTapisJob {
  execSys?: TTapisSystem;
}

export type TJobPostResponse = {
  response: IJobPostResponse;
  status: number;
};
