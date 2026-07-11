import type { AxiosRequestConfig } from 'axios';

export interface RetryableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}
