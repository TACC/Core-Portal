import axios, { AxiosError } from 'axios';

export type TApiError = AxiosError<{ message?: string }>;

export const apiClient = axios.create({
  xsrfHeaderName: 'X-CSRFToken',
  xsrfCookieName: 'csrftoken',
});
