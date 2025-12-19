import { AlertRule, IAlertRule, IAlertCondition } from "../models/AlertRule";
import { Notification } from "../models/Notification";
import { ISession } from "../models/Session";
import { EventEmitter } from "events";

export class AlertService extends EventEmitter {
  private rules: IAlertRule[] = [];
  private lastRuleLoadTime: Date = new Date(0);
  private ruleRefreshInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.loadRules();
    // Refresh rules every 30 seconds to pick up changes
    this.ruleRefreshInterval = setInterval(() => this.loadRules(), 30000);
  }

  async loadRules(): Promise<void> {
    try {
      this.rules = await AlertRule.find({ enabled: true }).lean();
      this.lastRuleLoadTime = new Date();
      console.log(`Loaded ${this.rules.length} active alert rules`);
    } catch (error) {
      console.error("Failed to load alert rules:", error);
    }
  }

  async checkSession(session: ISession): Promise<void> {
    if (this.rules.length === 0) {
      return;
    }

    for (const rule of this.rules) {
      // Check if rule is in cooldown period
      if (this.isInCooldown(rule)) {
        continue;
      }

      // Check if all conditions match
      const matches = this.evaluateConditions(session, rule.conditions);

      if (matches) {
        await this.triggerAlert(rule, session);
      }
    }
  }

  private isInCooldown(rule: IAlertRule): boolean {
    if (!rule.lastTriggered || rule.cooldownMinutes === 0) {
      return false;
    }

    const cooldownMs = rule.cooldownMinutes * 60 * 1000;
    const timeSinceLastTrigger = Date.now() - rule.lastTriggered.getTime();
    return timeSinceLastTrigger < cooldownMs;
  }

  private evaluateConditions(session: ISession, conditions: IAlertCondition[]): boolean {
    // All conditions must match (AND logic)
    return conditions.every((condition) => this.evaluateCondition(session, condition));
  }

  private evaluateCondition(session: ISession, condition: IAlertCondition): boolean {
    const { type, operator, value } = condition;

    switch (type) {
      case "status_code":
        return this.compareValue(session.response?.statusCode, operator, value);

      case "status_range":
        // value should be like "5xx", "4xx", etc.
        if (typeof value !== "string") return false;
        const statusCode = session.response?.statusCode;
        if (!statusCode) return false;

        const rangePrefix = value.replace("xx", "");
        const statusPrefix = Math.floor(statusCode / 100);
        return operator === "equals"
          ? statusPrefix === parseInt(rangePrefix)
          : statusPrefix !== parseInt(rangePrefix);

      case "response_time":
        // Calculate response time from timestamps if available
        const responseTime = this.calculateResponseTime(session);
        return this.compareValue(responseTime, operator, value);

      case "method":
        return this.compareValue(session.request.method, operator, value);

      case "url_pattern":
        const uri = session.request.uri;
        if (operator === "contains") {
          return uri.includes(String(value));
        } else if (operator === "regex") {
          try {
            const regex = new RegExp(String(value));
            return regex.test(uri);
          } catch {
            return false;
          }
        }
        return this.compareValue(uri, operator, value);

      default:
        return false;
    }
  }

  private compareValue(
    actualValue: any,
    operator: string,
    expectedValue: string | number
  ): boolean {
    switch (operator) {
      case "equals":
        return actualValue == expectedValue;
      case "not_equals":
        return actualValue != expectedValue;
      case "greater_than":
        return Number(actualValue) > Number(expectedValue);
      case "less_than":
        return Number(actualValue) < Number(expectedValue);
      case "contains":
        return String(actualValue).includes(String(expectedValue));
      case "regex":
        try {
          const regex = new RegExp(String(expectedValue));
          return regex.test(String(actualValue));
        } catch {
          return false;
        }
      default:
        return false;
    }
  }

  private calculateResponseTime(session: ISession): number | null {
    // This is a placeholder - you might want to add timing data to your session model
    // For now, return null if not available
    return null;
  }

  private async triggerAlert(rule: IAlertRule, session: ISession): Promise<void> {
    try {
      // Create notification
      const notification = await Notification.create({
        ruleId: rule._id,
        ruleName: rule.name,
        severity: rule.severity,
        message: this.generateAlertMessage(rule, session),
        sessionId: session.sessionId,
        sessionData: {
          method: session.request.method,
          uri: session.request.uri,
          statusCode: session.response?.statusCode,
          sourceIp: session.sourceIp,
          destIp: session.destIp,
          timestamp: session.timestamp,
        },
        status: "unread",
      });

      // Update rule's last triggered time
      await AlertRule.updateOne(
        { _id: rule._id },
        { $set: { lastTriggered: new Date() } }
      );

      // Emit event for real-time notification
      this.emit("notification", notification);

      console.log(`Alert triggered: ${rule.name} for session ${session.sessionId}`);
    } catch (error) {
      console.error("Failed to trigger alert:", error);
    }
  }

  private generateAlertMessage(rule: IAlertRule, session: ISession): string {
    const method = session.request.method;
    const uri = session.request.uri;
    const statusCode = session.response?.statusCode;

    let message = `Alert: ${rule.name}\n`;
    message += `${method} ${uri}`;

    if (statusCode) {
      message += ` returned ${statusCode}`;
    }

    return message;
  }

  stop(): void {
    if (this.ruleRefreshInterval) {
      clearInterval(this.ruleRefreshInterval);
      this.ruleRefreshInterval = null;
    }
  }
}
