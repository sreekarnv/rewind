import type { SessionSummary, Session, HttpHeader } from "./types";

interface HAREntry {
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    httpVersion: string;
    headers: Array<{ name: string; value: string }>;
    queryString: Array<{ name: string; value: string }>;
    cookies: Array<{ name: string; value: string }>;
    headersSize: number;
    bodySize: number;
    postData?: {
      mimeType: string;
      text: string;
    };
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    headers: Array<{ name: string; value: string }>;
    cookies: Array<{ name: string; value: string }>;
    content: {
      size: number;
      mimeType: string;
      text?: string;
    };
    redirectURL: string;
    headersSize: number;
    bodySize: number;
  };
  cache: Record<string, never>;
  timings: {
    send: number;
    wait: number;
    receive: number;
  };
  serverIPAddress?: string;
  connection?: string;
}

interface HAR {
  log: {
    version: string;
    creator: {
      name: string;
      version: string;
    };
    pages?: Array<{
      startedDateTime: string;
      id: string;
      title: string;
      pageTimings: {
        onContentLoad: number;
        onLoad: number;
      };
    }>;
    entries: HAREntry[];
  };
}

function parseQueryString(url: string): Array<{ name: string; value: string }> {
  try {
    const urlObj = new URL(url);
    const params: Array<{ name: string; value: string }> = [];
    urlObj.searchParams.forEach((value, name) => {
      params.push({ name, value });
    });
    return params;
  } catch {
    return [];
  }
}

function parseCookies(
  headers: HttpHeader[],
): Array<{ name: string; value: string }> {
  const cookies: Array<{ name: string; value: string }> = [];
  const cookieHeader = headers.find(
    (h) =>
      h.name.toLowerCase() === "cookie" ||
      h.name.toLowerCase() === "set-cookie",
  );

  if (cookieHeader) {
    const cookiePairs = cookieHeader.value.split(";");
    cookiePairs.forEach((pair) => {
      const [name, ...valueParts] = pair.trim().split("=");
      if (name) {
        cookies.push({
          name: name.trim(),
          value: valueParts.join("=").trim(),
        });
      }
    });
  }

  return cookies;
}

function getMimeType(headers: HttpHeader[]): string {
  const contentType = headers.find(
    (h) => h.name.toLowerCase() === "content-type",
  );
  if (contentType) {
    return contentType.value.split(";")[0].trim();
  }
  return "application/octet-stream";
}

export function sessionToHAREntry(session: Session): HAREntry {
  const startTime = new Date(session.timestamp);

  const protocol = session.destPort === 443 ? "https" : "http";
  const fullUrl = `${protocol}://${session.destIp}:${session.destPort}${session.request.uri}`;

  const requestHeaders = session.request.headers || [];
  const responseHeaders = session.response?.headers || [];

  const entry: HAREntry = {
    startedDateTime: startTime.toISOString(),
    time: 0,
    request: {
      method: session.request.method,
      url: fullUrl,
      httpVersion: session.request.version || "HTTP/1.1",
      headers: requestHeaders.map((h) => ({ name: h.name, value: h.value })),
      queryString: parseQueryString(fullUrl),
      cookies: parseCookies(requestHeaders),
      headersSize: -1,
      bodySize: session.request.body ? session.request.body.length : 0,
    },
    response: {
      status: session.response?.statusCode || 0,
      statusText: session.response?.statusMessage || "",
      httpVersion: session.response?.version || "HTTP/1.1",
      headers: responseHeaders.map((h) => ({ name: h.name, value: h.value })),
      cookies: parseCookies(responseHeaders),
      content: {
        size: session.response?.body ? session.response.body.length : 0,
        mimeType: getMimeType(responseHeaders),
        text: session.response?.body,
      },
      redirectURL: "",
      headersSize: -1,
      bodySize: session.response?.body ? session.response.body.length : 0,
    },
    cache: {},
    timings: {
      send: -1,
      wait: -1,
      receive: -1,
    },
    serverIPAddress: session.destIp,
    connection: `${session.sourcePort}`,
  };

  if (
    session.request.body &&
    (session.request.method === "POST" || session.request.method === "PUT")
  ) {
    entry.request.postData = {
      mimeType: getMimeType(requestHeaders),
      text: session.request.body,
    };
  }

  return entry;
}

export function fullSessionsToHAR(sessions: Session[]): HAR {
  const har: HAR = {
    log: {
      version: "1.2",
      creator: {
        name: "Rewind HTTP Capture",
        version: "1.0.0",
      },
      entries: sessions.map((session) => sessionToHAREntry(session)),
    },
  };

  return har;
}

export function sessionsToHAR(sessions: SessionSummary[]): HAR {
  const har: HAR = {
    log: {
      version: "1.2",
      creator: {
        name: "Rewind HTTP Capture",
        version: "1.0.0",
      },
      entries: sessions.map((session) => {
        const startTime = new Date(session.timestamp);
        const protocol = session.destPort === 443 ? "https" : "http";
        const fullUrl = `${protocol}://${session.destIp}:${session.destPort}${session.uri}`;

        return {
          startedDateTime: startTime.toISOString(),
          time: 0,
          request: {
            method: session.method,
            url: fullUrl,
            httpVersion: "HTTP/1.1",
            headers: [],
            queryString: parseQueryString(fullUrl),
            cookies: [],
            headersSize: -1,
            bodySize: -1,
          },
          response: {
            status: session.statusCode || 0,
            statusText: "",
            httpVersion: "HTTP/1.1",
            headers: [],
            cookies: [],
            content: {
              size: 0,
              mimeType: "application/octet-stream",
            },
            redirectURL: "",
            headersSize: -1,
            bodySize: -1,
          },
          cache: {},
          timings: {
            send: -1,
            wait: -1,
            receive: -1,
          },
          serverIPAddress: session.destIp,
          connection: `${session.sourcePort}`,
        };
      }),
    },
  };

  return har;
}

export function sessionsToJSON(sessions: SessionSummary[]): string {
  return JSON.stringify(sessions, null, 2);
}

export function sessionsToCSV(sessions: SessionSummary[]): string {
  if (sessions.length === 0) {
    return "";
  }

  const headers = [
    "Timestamp",
    "Method",
    "URL",
    "Status Code",
    "Source IP",
    "Source Port",
    "Destination IP",
    "Destination Port",
    "Session ID",
  ];

  const rows = sessions.map((session) => {
    const protocol = session.destPort === 443 ? "https" : "http";
    const fullUrl = `${protocol}://${session.destIp}:${session.destPort}${session.uri}`;

    return [
      new Date(session.timestamp).toISOString(),
      session.method,
      fullUrl,
      session.statusCode?.toString() || "N/A",
      session.sourceIp,
      session.sourcePort.toString(),
      session.destIp,
      session.destPort.toString(),
      session.sessionId,
    ];
  });

  const escapeCSV = (field: string): string => {
    if (field.includes(",") || field.includes('"') || field.includes("\n")) {
      return `"${field.replace(/"/g, '""')}"`;
    }
    return field;
  };

  const csvLines = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ];

  return csvLines.join("\n");
}

export function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportSessions(
  sessions: SessionSummary[],
  format: "har" | "json" | "csv",
  filename?: string,
): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  let content: string;
  let mimeType: string;
  let defaultFilename: string;

  switch (format) {
    case "har":
      content = JSON.stringify(sessionsToHAR(sessions), null, 2);
      mimeType = "application/json";
      defaultFilename = `rewind-sessions-${timestamp}.har`;
      break;
    case "json":
      content = sessionsToJSON(sessions);
      mimeType = "application/json";
      defaultFilename = `rewind-sessions-${timestamp}.json`;
      break;
    case "csv":
      content = sessionsToCSV(sessions);
      mimeType = "text/csv";
      defaultFilename = `rewind-sessions-${timestamp}.csv`;
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }

  downloadFile(content, filename || defaultFilename, mimeType);
}

export function exportFullSessions(
  sessions: Session[],
  format: "har" | "json" | "csv",
  filename?: string,
): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  let content: string;
  let mimeType: string;
  let defaultFilename: string;

  switch (format) {
    case "har":
      content = JSON.stringify(fullSessionsToHAR(sessions), null, 2);
      mimeType = "application/json";
      defaultFilename = `rewind-sessions-${timestamp}.har`;
      break;
    case "json":
      // For full sessions, export the complete Session objects
      content = JSON.stringify(sessions, null, 2);
      mimeType = "application/json";
      defaultFilename = `rewind-sessions-${timestamp}.json`;
      break;
    case "csv":
      const summaries: SessionSummary[] = sessions.map((s) => ({
        sessionId: s.sessionId,
        timestamp: s.timestamp,
        sourceIp: s.sourceIp,
        sourcePort: s.sourcePort,
        destIp: s.destIp,
        destPort: s.destPort,
        method: s.method,
        uri: s.uri,
        statusCode: s.statusCode,
      }));
      content = sessionsToCSV(summaries);
      mimeType = "text/csv";
      defaultFilename = `rewind-sessions-${timestamp}.csv`;
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }

  downloadFile(content, filename || defaultFilename, mimeType);
}
