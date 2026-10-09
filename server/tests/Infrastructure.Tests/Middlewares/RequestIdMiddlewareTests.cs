using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Audex.WebApi.Constants;
using Audex.WebApi.Middlewares;

namespace Audex.Infrastructure.Tests.Middlewares
{
    public class RequestIdMiddlewareTests
    {
        [Fact]
        public async Task InvokeAsync_WhenRequestIdHeaderMissing_GeneratesNewGuidAndSetsResponseHeadersAndContextItem()
        {
            // Arrange
            var nextInvoked = false;
            RequestDelegate next = (HttpContext context) =>
            {
                nextInvoked = true;
                return Task.CompletedTask;
            };

            var middleware = new RequestIdMiddleware(next);
            var httpContext = new DefaultHttpContext();

            // Act
            await middleware.InvokeAsync(httpContext);

            // Assert
            Assert.True(nextInvoked);

            var hasResponseRequestIdHeader = httpContext.Response.Headers.TryGetValue(
                RequestIdMiddleware.RequestIdHeader,
                out var responseRequestIdHeader);
            Assert.True(hasResponseRequestIdHeader);

            var responseRequestId = responseRequestIdHeader.ToString();
            Assert.False(string.IsNullOrWhiteSpace(responseRequestId));
            Assert.True(Guid.TryParse(responseRequestId, out _));

            Assert.True(httpContext.Items.TryGetValue(RequestIdMiddleware.RequestIdItemKey, out var itemValue));
            Assert.Equal(responseRequestId, itemValue?.ToString());
        }

        [Fact]
        public async Task InvokeAsync_WhenRequestIdHeaderProvided_PreservesExistingHeaderAndSetsContextItem()
        {
            // Arrange
            const string existingRequestId = "client-request-id-98765";
            var nextInvoked = false;
            RequestDelegate next = (HttpContext context) =>
            {
                nextInvoked = true;
                return Task.CompletedTask;
            };

            var middleware = new RequestIdMiddleware(next);
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Headers[RequestIdMiddleware.RequestIdHeader] = existingRequestId;

            // Act
            await middleware.InvokeAsync(httpContext);

            // Assert
            Assert.True(nextInvoked);

            var hasResponseRequestIdHeader = httpContext.Response.Headers.TryGetValue(
                RequestIdMiddleware.RequestIdHeader,
                out var responseRequestIdHeader);
            Assert.True(hasResponseRequestIdHeader);
            Assert.Equal(existingRequestId, responseRequestIdHeader.ToString());

            Assert.True(httpContext.Items.TryGetValue(RequestIdMiddleware.RequestIdItemKey, out var itemValue));
            Assert.Equal(existingRequestId, itemValue?.ToString());
        }

        [Fact]
        public async Task InvokeAsync_WhenRequestIdHeaderIsWhitespace_GeneratesNewGuid()
        {
            // Arrange
            var nextInvoked = false;
            RequestDelegate next = (HttpContext context) =>
            {
                nextInvoked = true;
                return Task.CompletedTask;
            };

            var middleware = new RequestIdMiddleware(next);
            var httpContext = new DefaultHttpContext();
            httpContext.Request.Headers[RequestIdMiddleware.RequestIdHeader] = "   ";

            // Act
            await middleware.InvokeAsync(httpContext);

            // Assert
            Assert.True(nextInvoked);

            var hasResponseRequestIdHeader = httpContext.Response.Headers.TryGetValue(
                RequestIdMiddleware.RequestIdHeader,
                out var responseRequestIdHeader);
            Assert.True(hasResponseRequestIdHeader);

            var generatedRequestId = responseRequestIdHeader.ToString();
            Assert.NotEqual("   ", generatedRequestId);
            Assert.True(Guid.TryParse(generatedRequestId, out _));
        }
    }
}
