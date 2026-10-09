using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Serilog.Context;
using Audex.WebApi.Constants;

namespace Audex.WebApi.Middlewares
{
    public class RequestIdMiddleware
    {
        public const string RequestIdHeader = LogPropertyConstants.RequestIdHeader;
        public const string RequestIdItemKey = LogPropertyConstants.RequestId;

        private readonly RequestDelegate _next;

        public RequestIdMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var requestId = ResolveRequestId(context);

            context.Items[RequestIdItemKey] = requestId;

            if (!context.Response.Headers.ContainsKey(RequestIdHeader))
            {
                context.Response.Headers[RequestIdHeader] = requestId;
            }

            using (LogContext.PushProperty(RequestIdItemKey, requestId))
            {
                await _next(context);
            }
        }

        private static string ResolveRequestId(HttpContext context)
        {
            if (context.Request.Headers.TryGetValue(LogPropertyConstants.RequestIdHeader, out var requestHeaderValues))
            {
                var existingRequestId = requestHeaderValues.ToString();
                if (!string.IsNullOrWhiteSpace(existingRequestId))
                {
                    return existingRequestId;
                }
            }

            return Guid.NewGuid().ToString("D");
        }
    }
}
