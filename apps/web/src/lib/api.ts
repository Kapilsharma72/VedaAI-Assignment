import axios, { AxiosError } from 'axios';


export class ApiError extends Error {
  statusCode: number;
  errors?: Record<string, string>;

  constructor(message: string, statusCode: number, errors?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.errors = errors;

    // Restore prototype chain (required when extending built-in classes in TypeScript)
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}


const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});


api.interceptors.response.use(
  (response) => {
    return response.data?.data !== undefined ? response.data.data : response.data;
  },
  (error: AxiosError<{ message?: string; errors?: Record<string, string> }>) => {
    const statusCode = error.response?.status ?? 500;
    const message =
      error.response?.data?.message ?? error.message ?? 'An unexpected error occurred';
    const errors = error.response?.data?.errors;

    throw new ApiError(message, statusCode, errors);
  }
);

export default api;
