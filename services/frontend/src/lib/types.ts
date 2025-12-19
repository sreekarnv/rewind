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

export type AlertSeverity = "info" | "warning" | "error" | "critical";
export type NotificationStatus = "unread" | "read" | "dismissed";

export interface Notification {
  _id: string;
  ruleId: string;
  ruleName: string;
  severity: AlertSeverity;
  message: string;
  sessionId: string;
  sessionData: {
    method: string;
    uri: string;
    statusCode?: number;
    sourceIp: string;
    destIp: string;
    timestamp: string;
  };
  status: NotificationStatus;
  createdAt: string;
  updatedAt: string;
  readAt?: string;
  dismissedAt?: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  limit: number;
  skip: number;
}

export interface AlertCondition {
  type: "status_code" | "status_range" | "response_time" | "method" | "url_pattern";
  operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains" | "regex";
  value: string | number;
}

export interface AlertRule {
  _id: string;
  name: string;
  description?: string;
  enabled: boolean;
  severity: AlertSeverity;
  conditions: AlertCondition[];
  cooldownMinutes: number;
  createdAt: string;
  updatedAt: string;
  lastTriggered?: string;
}

export interface AlertRuleListResponse {
  rules: AlertRule[];
  total: number;
}
