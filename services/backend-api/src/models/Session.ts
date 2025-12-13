import mongoose, { Schema, Document } from "mongoose";

export interface IHttpHeader {
  name: string;
  value: string;
}

export interface IHttpRequest {
  method: string;
  uri: string;
  version: string;
  headers: IHttpHeader[];
  body?: string;
}

export interface IHttpResponse {
  version: string;
  statusCode: number;
  statusMessage: string;
  headers: IHttpHeader[];
  body?: string;
}

export interface ISession extends Document {
  sessionId: string;
  timestamp: string;
  sourceIp: string;
  sourcePort: number;
  destIp: string;
  destPort: number;
  request: IHttpRequest;
  response?: IHttpResponse;
  createdAt: Date;
  updatedAt: Date;
}

const HttpHeaderSchema = new Schema(
  {
    name: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false },
);

const HttpRequestSchema = new Schema(
  {
    method: { type: String, required: true },
    uri: { type: String, required: true },
    version: { type: String, required: true },
    headers: { type: [HttpHeaderSchema], required: true },
    body: { type: String },
  },
  { _id: false },
);

const HttpResponseSchema = new Schema(
  {
    version: { type: String, required: true },
    statusCode: { type: Number, required: true },
    statusMessage: { type: String, required: true },
    headers: { type: [HttpHeaderSchema], required: true },
    body: { type: String },
  },
  { _id: false },
);

const SessionSchema = new Schema<ISession>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    timestamp: { type: String, required: true },
    sourceIp: { type: String, required: true },
    sourcePort: { type: Number, required: true },
    destIp: { type: String, required: true },
    destPort: { type: Number, required: true },
    request: { type: HttpRequestSchema, required: true },
    response: { type: HttpResponseSchema },
  },
  {
    timestamps: true,
    collection: "sessions",
  },
);

SessionSchema.index({ timestamp: -1 });
SessionSchema.index({ "request.method": 1 });
SessionSchema.index({ "response.statusCode": 1 });

export const Session = mongoose.model<ISession>("Session", SessionSchema);
