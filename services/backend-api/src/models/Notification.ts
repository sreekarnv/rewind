import mongoose, { Schema, Document } from "mongoose";
import { AlertSeverity } from "./AlertRule";

export type NotificationStatus = "unread" | "read" | "dismissed";

export interface INotification extends Document {
  ruleId: mongoose.Types.ObjectId;
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
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;
  dismissedAt?: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    ruleId: { type: Schema.Types.ObjectId, ref: "AlertRule", required: true },
    ruleName: { type: String, required: true },
    severity: {
      type: String,
      enum: ["info", "warning", "error", "critical"],
      required: true,
    },
    message: { type: String, required: true },
    sessionId: { type: String, required: true, index: true },
    sessionData: {
      method: { type: String, required: true },
      uri: { type: String, required: true },
      statusCode: { type: Number },
      sourceIp: { type: String, required: true },
      destIp: { type: String, required: true },
      timestamp: { type: String, required: true },
    },
    status: {
      type: String,
      enum: ["unread", "read", "dismissed"],
      default: "unread",
    },
    readAt: { type: Date },
    dismissedAt: { type: Date },
  },
  {
    timestamps: true,
    collection: "notifications",
  }
);

NotificationSchema.index({ status: 1, createdAt: -1 });
NotificationSchema.index({ sessionId: 1 });
NotificationSchema.index({ ruleId: 1 });
NotificationSchema.index({ createdAt: -1 });

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
