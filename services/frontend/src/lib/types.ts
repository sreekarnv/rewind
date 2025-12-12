// TypeScript types matching backend API
// Note: Using camelCase to match C++ capture agent output

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
	response?: HttpMessage; // Optional - may not exist for incomplete captures
	requestTime?: number;
	responseTime?: number;
	duration?: number;
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

export interface Session extends SessionSummary {
	transactions: HttpTransaction[];
}

export interface SessionListResponse {
	sessions: SessionSummary[];
	total: number;
}

export interface SessionDetailResponse {
	session: Session;
}

export interface SessionRequestsResponse {
	sessionId: string;
	transactions: HttpTransaction[];
	total: number;
}

export interface Stats {
	totalSessions: number;
	totalRequests: number;
	methodDistribution: Record<string, number>;
	statusDistribution: Record<string, number>;
}

export interface ErrorResponse {
	error: string;
	message: string;
	statusCode: number;
}
