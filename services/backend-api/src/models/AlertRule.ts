import mongoose, { Schema, Document } from "mongoose";

export type AlertConditionType =
  | "status_code"
  | "status_range"
  | "response_time"
  | "method"
  | "url_pattern";

export type AlertSeverity = "info" | "warning" | "error" | "critical";

export interface IAlertCondition {
  type: AlertConditionType;
  operator: "equals" | "not_equals" | "greater_than" | "less_than" | "contains" | "regex";
  value: string | number;
}

export interface IAlertRule extends Document {
  name: string;
  description?: string;
  enabled: boolean;
  severity: AlertSeverity;
  conditions: IAlertCondition[];
  cooldownMinutes: number; // Prevent alert spam
  createdAt: Date;
  updatedAt: Date;
  lastTriggered?: Date;
}

const AlertConditionSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["status_code", "status_range", "response_time", "method", "url_pattern"],
      required: true,
    },
    operator: {
      type: String,
      enum: ["equals", "not_equals", "greater_than", "less_than", "contains", "regex"],
      required: true,
    },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const AlertRuleSchema = new Schema<IAlertRule>(
  {
    name: { type: String, required: true },
    description: { type: String },
    enabled: { type: Boolean, default: true },
    severity: {
      type: String,
      enum: ["info", "warning", "error", "critical"],
      default: "warning",
    },
    conditions: { type: [AlertConditionSchema], required: true },
    cooldownMinutes: { type: Number, default: 5 },
    lastTriggered: { type: Date },
  },
  {
    timestamps: true,
    collection: "alert_rules",
  }
);

AlertRuleSchema.index({ enabled: 1 });
AlertRuleSchema.index({ lastTriggered: -1 });

export const AlertRule = mongoose.model<IAlertRule>("AlertRule", AlertRuleSchema);
