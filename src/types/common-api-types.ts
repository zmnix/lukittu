export interface ErrorResponse {
  field?: string | number;
  message: string;
  [key: string]: any;
}
