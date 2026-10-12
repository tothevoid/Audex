export const ServerNotificationEvents = {
    NotificationReceived: "NotificationReceived",
    NotificationRead: "NotificationRead",
    AllNotificationsRead: "AllNotificationsRead",
    QuotesRecalculated: "QuotesRecalculated",
    ScheduledTaskStarted: "ScheduledTaskStarted",
    ScheduledTaskExecutionRecorded: "ScheduledTaskExecutionRecorded",
    ToastReceived: "ToastReceived"
} as const;

export type ServerNotificationEventName = typeof ServerNotificationEvents[keyof typeof ServerNotificationEvents];
