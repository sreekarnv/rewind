import { Elysia, t } from "elysia";
import { Notification } from "../models/Notification";

export const notificationsRoute = new Elysia({ prefix: "/api/v1/notifications" })
  // Get all notifications
  .get(
    "/",
    async ({ query }) => {
      const limit = query.limit || 50;
      const skip = query.skip || 0;
      const status = query.status;

      const filter: any = {};
      if (status && ["unread", "read", "dismissed"].includes(status)) {
        filter.status = status;
      }

      const notifications = await Notification.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);

      const total = await Notification.countDocuments(filter);
      const unreadCount = await Notification.countDocuments({ status: "unread" });

      return {
        notifications,
        total,
        unreadCount,
        limit,
        skip,
      };
    },
    {
      query: t.Object({
        limit: t.Optional(t.Number()),
        skip: t.Optional(t.Number()),
        status: t.Optional(t.Union([
          t.Literal("unread"),
          t.Literal("read"),
          t.Literal("dismissed"),
        ])),
      }),
    }
  )

  // Get unread count
  .get("/unread/count", async () => {
    const count = await Notification.countDocuments({ status: "unread" });
    return { count };
  })

  // Get single notification
  .get("/:id", async ({ params: { id }, set }) => {
    const notification = await Notification.findById(id);

    if (!notification) {
      set.status = 404;
      return {
        error: "Not Found",
        message: "Notification not found",
        statusCode: 404,
      };
    }

    return { notification };
  })

  // Mark notification as read
  .patch("/:id/read", async ({ params: { id }, set }) => {
    const notification = await Notification.findById(id);

    if (!notification) {
      set.status = 404;
      return {
        error: "Not Found",
        message: "Notification not found",
        statusCode: 404,
      };
    }

    notification.status = "read";
    notification.readAt = new Date();
    await notification.save();

    return { notification };
  })

  // Mark notification as dismissed
  .patch("/:id/dismiss", async ({ params: { id }, set }) => {
    const notification = await Notification.findById(id);

    if (!notification) {
      set.status = 404;
      return {
        error: "Not Found",
        message: "Notification not found",
        statusCode: 404,
      };
    }

    notification.status = "dismissed";
    notification.dismissedAt = new Date();
    await notification.save();

    return { notification };
  })

  // Mark all notifications as read
  .patch("/read-all", async () => {
    const result = await Notification.updateMany(
      { status: "unread" },
      { $set: { status: "read", readAt: new Date() } }
    );

    return {
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    };
  })

  // Delete notification
  .delete("/:id", async ({ params: { id }, set }) => {
    const notification = await Notification.findByIdAndDelete(id);

    if (!notification) {
      set.status = 404;
      return {
        error: "Not Found",
        message: "Notification not found",
        statusCode: 404,
      };
    }

    return {
      message: "Notification deleted successfully",
      notificationId: id,
    };
  })

  // Clear all notifications
  .delete("/", async ({ query }) => {
    const status = query.status;

    const filter: any = {};
    if (status && ["read", "dismissed"].includes(status)) {
      filter.status = status;
    }

    const result = await Notification.deleteMany(filter);

    return {
      message: "Notifications cleared successfully",
      deletedCount: result.deletedCount,
    };
  }, {
    query: t.Object({
      status: t.Optional(t.Union([
        t.Literal("read"),
        t.Literal("dismissed"),
      ])),
    }),
  });
