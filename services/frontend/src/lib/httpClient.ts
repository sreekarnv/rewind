import type { HttpHeader } from "./types";

export interface ReplayRequest {
  method: string;
  url: string;
  headers: HttpHeader[];
  body?: string;
}

export interface ReplayResponse {
  status: number;
  statusText: string;
  headers: HttpHeader[];
  body: string;
  contentType?: string;
  duration: number;
  error?: string;
}

export async function sendRequest(
  request: ReplayRequest,
): Promise<ReplayResponse> {
  const startTime = performance.now();

  try {
    const headersObj: Record<string, string> = {};
    request.headers.forEach((header) => {
      headersObj[header.name] = header.value;
    });

    const response = await fetch(request.url, {
      method: request.method,
      headers: headersObj,
      body: request.body || undefined,
      mode: "cors",
    });

    const endTime = performance.now();
    const duration = endTime - startTime;

    const responseBody = await response.text();

    const responseHeaders: HttpHeader[] = [];
    response.headers.forEach((value, name) => {
      responseHeaders.push({ name, value });
    });

    const contentType = response.headers.get("content-type") || undefined;

    return {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
      body: responseBody,
      contentType,
      duration: Math.round(duration),
    };
  } catch (error) {
    const endTime = performance.now();
    const duration = endTime - startTime;

    return {
      status: 0,
      statusText: "Network Error",
      headers: [],
      body: "",
      duration: Math.round(duration),
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
