namespace Audex.WebApi.Constants
{
    public static class LogPropertyConstants
    {
        public const string RequestId = "RequestId";
        public const string RequestIdHeader = "X-Request-Id";
        public const string ClientIp = "ClientIp";
        public const string UserAgent = "UserAgent";
        public const string QueryString = "QueryString";
        public const string UserId = "UserId";
        public const string LogsDirectoryName = "logs";
        public const string LogFilePattern = "audex-.log";
        public const string RequestLoggingMessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
        public const string ConsoleOutputTemplate = "[{Timestamp:HH:mm:ss} {Level:u3}] [{RequestId}] {Message:lj}{NewLine}{Exception}";
    }
}
