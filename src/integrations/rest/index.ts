import axios from 'axios';

export class HttpClient {
  private base: string;
  constructor(baseUrl: string) {
    this.base = baseUrl;
  }

  async post<T>(
    path: string,
    body: Record<string, string | number | Date>,
    headers?: Record<string, string>,
  ): Promise<T> {
    const response = await axios.post<T>(`${this.base}/${path}`, body, {
      headers,
    });

    return response.data;
  }

  async get<T>(
    path: string,
    params: Record<string, string | number | Date>,
    headers?: Record<string, string>,
  ): Promise<T> {
    const response = await axios.get<T>(`${this.base}${path}`, {
      params,
      headers,
    });

    return response.data;
  }
}
