import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { fetchUtil } from 'utils/fetchUtil';

export type TFormField = {
  name: string;
  label?: string;
  type?: string;
  options?: { value: string; label: string; [key: string]: unknown }[];
  optgroups?: { options: { value: string; label: string }[] }[];
  validation?: { required?: boolean; min?: number; max?: number };
  fields?: TFormField[];
  defaultValue?: unknown;
  [key: string]: unknown;
};

export type TFormDefinition = {
  form_fields: TFormField[];
};

// Fetch a form definition by name from the forms API
export const fetchForm = (formName: string): Promise<TFormDefinition> =>
  fetchUtil({
    url: '/api/forms',
    params: { form_name: formName },
  });

export const useForm = (
  formName: string,
  options: Partial<UseQueryOptions<TFormDefinition>> = {}
) =>
  useQuery({
    queryKey: ['form', formName],
    queryFn: () => fetchForm(formName),
    enabled: !!formName,
    ...options,
  });

export default useForm;
