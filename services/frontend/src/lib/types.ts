export interface HttpMessage {
  method?: string;
  uri?: string;
  statusCode?: number;
  statusMessage?: string;
  version?: string;
  headers: Record<string, string>;
  body?: string;
  bodyLength?: number;
  bodyType?: string;
  length: number;
  type?: string;
}

export interface HttpTransaction {
  request: HttpMessage;
  response?: HttpMessage;
  requestTime?: number;
  responseTime?: number;
  duration?: number;
}

export interface SessionSummary {
  sessionId: string;
  timestamp: string;
  sourceIp: string;
  sourcePort: number;
  destIp: string;
  destPort: number;
  method: string;
  uri: string;
  statusCode?: number;
}

export interface HttpHeader {
  name: string;
  value: string;
  source?: string;
}

export interface HttpRequest {
  method: string;
  uri: string;
  version: string;
  headers: HttpHeader[];
  body?: string;
}

export interface HttpResponse {
  version: string;
  statusCode: number;
  statusMessage: string;
  headers: HttpHeader[];
  body?: string;
}

export interface Session {
  sessionId: string;
  timestamp: string;
  sourceIp: string;
  sourcePort: number;
  destIp: string;
  destPort: number;
  request: HttpRequest;
  response?: HttpResponse;
}

export interface SessionListResponse {
  sessions: SessionSummary[];
  total: number;
  limit?: number;
  skip?: number;
}

export interface SessionDetailResponse {
  session: Session;
}

export interface Stats {
  totalSessions: number;
  methodDistribution: Record<string, number>;
  statusDistribution: Record<string, number>;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}
