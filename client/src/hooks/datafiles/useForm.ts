import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { fetchUtil } from 'utils/fetchUtil';
import { TFormDefinition } from 'utils/types';

// Fetch a form definition by name from the forms API
export const fetchForm = (formName: string): Promise<TFormDefinition> =>
  fetchUtil({
    url: '/api/forms',
    params: { form_name: formName },
  }).then((resp) => resp.response);

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
