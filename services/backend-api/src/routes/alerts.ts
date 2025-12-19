import { Elysia, t } from "elysia";
import { AlertRule } from "../models/AlertRule";

export const alertsRoute = new Elysia({ prefix: "/api/v1/alerts" })
  // Get all alert rules
  .get("/", async () => {
    const rules = await AlertRule.find().sort({ createdAt: -1 });
    return {
      rules,
      total: rules.length,
    };
  })

  // Get single alert rule
  .get("/:id", async ({ params: { id }, set }) => {
    const rule = await AlertRule.findById(id);
    if (!rule) {
      set.status = 404;
      return {
        error: "Not Found",
        message: "Alert rule not found",
        statusCode: 404,
      };
    }
    return { rule };
  })

  // Create new alert rule
  .post(
    "/",
    async ({ body }) => {
      const rule = await AlertRule.create(body);
      return { rule };
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
        enabled: t.Optional(t.Boolean()),
        severity: t.Union([
          t.Literal("info"),
          t.Literal("warning"),
          t.Literal("error"),
          t.Literal("critical"),
        ]),
        conditions: t.Array(
          t.Object({
            type: t.Union([
              t.Literal("status_code"),
              t.Literal("status_range"),
              t.Literal("response_time"),
              t.Literal("method"),
              t.Literal("url_pattern"),
            ]),
            operator: t.Union([
              t.Literal("equals"),
              t.Literal("not_equals"),
              t.Literal("greater_than"),
              t.Literal("less_than"),
              t.Literal("contains"),
              t.Literal("regex"),
            ]),
            value: t.Union([t.String(), t.Number()]),
          })
        ),
        cooldownMinutes: t.Optional(t.Number()),
      }),
    }
  )

  // Update alert rule
  .put(
    "/:id",
    async ({ params: { id }, body, set }) => {
      const rule = await AlertRule.findByIdAndUpdate(id, body, {
        new: true,
        runValidators: true,
      });

      if (!rule) {
        set.status = 404;
        return {
          error: "Not Found",
          message: "Alert rule not found",
          statusCode: 404,
        };
      }

      return { rule };
    },
    {
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        enabled: t.Optional(t.Boolean()),
        severity: t.Optional(
          t.Union([
            t.Literal("info"),
            t.Literal("warning"),
            t.Literal("error"),
            t.Literal("critical"),
          ])
        ),
        conditions: t.Optional(
          t.Array(
            t.Object({
              type: t.Union([
                t.Literal("status_code"),
                t.Literal("status_range"),
                t.Literal("response_time"),
                t.Literal("method"),
                t.Literal("url_pattern"),
              ]),
              operator: t.Union([
                t.Literal("equals"),
                t.Literal("not_equals"),
                t.Literal("greater_than"),
                t.Literal("less_than"),
                t.Literal("contains"),
                t.Literal("regex"),
              ]),
              value: t.Union([t.String(), t.Number()]),
            })
          )
        ),
        cooldownMinutes: t.Optional(t.Number()),
      }),
    }
  )

  // Delete alert rule
  .delete("/:id", async ({ params: { id }, set }) => {
    const rule = await AlertRule.findByIdAndDelete(id);

    if (!rule) {
      set.status = 404;
      return {
        error: "Not Found",
        message: "Alert rule not found",
        statusCode: 404,
      };
    }

    return {
      message: "Alert rule deleted successfully",
      ruleId: id,
    };
  })

  // Toggle alert rule enabled/disabled
  .patch("/:id/toggle", async ({ params: { id }, set }) => {
    const rule = await AlertRule.findById(id);

    if (!rule) {
      set.status = 404;
      return {
        error: "Not Found",
        message: "Alert rule not found",
        statusCode: 404,
      };
    }

    rule.enabled = !rule.enabled;
    await rule.save();

    return { rule };
  });
