/**
 * TypeScript types matching C++ capture agent JSON output
 * Note: C++ uses camelCase for JSON output
 */

export interface HttpMessage {
  method?: string;
  uri?: string;
  version?: string;
  statusCode?: number; // C++ uses camelCase
  statusMessage?: string; // C++ uses camelCase
  headers: Record<string, string>;
  body?: string;
  bodyLength?: number; // C++ uses camelCase
  bodyType?: string; // C++ uses camelCase
  length: number;
  type?: string;
}

export interface HttpTransaction {
  request: HttpMessage;
  response?: HttpMessage; // Optional - may not exist for incomplete captures
  requestTime?: number; // C++ uses camelCase
  responseTime?: number; // C++ uses camelCase
  duration?: number;
}

export interface Session {
  sessionId: string; // C++ uses camelCase
  clientIp: string; // C++ uses camelCase
  clientPort: number; // C++ uses camelCase
  serverIp: string; // C++ uses camelCase
  serverPort: number; // C++ uses camelCase
  startTime: number; // C++ uses camelCase
  endTime: number; // C++ uses camelCase
  duration: number;
  transactionCount: number; // C++ uses camelCase
  transactions: HttpTransaction[];
}

export interface CapturedData {
  sessionCount: number; // C++ uses camelCase
  sessions: Session[];
}

// API response types
export interface SessionListResponse {
  sessions: SessionSummary[];
  total: number;
}

export interface SessionSummary {
  sessionId: string;
  clientIp: string;
  clientPort: number;
  serverIp: string;
  serverPort: number;
  startTime: number;
  endTime: number;
  duration: number;
  transactionCount: number;
}

export interface SessionDetailResponse {
  session: Session;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}
