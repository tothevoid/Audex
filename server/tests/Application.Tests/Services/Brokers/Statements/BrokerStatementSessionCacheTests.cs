using System;
using Microsoft.Extensions.Caching.Memory;
using Audex.Application.DTO.Brokers.Statements;
using Audex.Application.Services.Brokers.Statements;
using Xunit;

namespace Audex.Application.Tests.Services.Brokers.Statements
{
    public class BrokerStatementSessionCacheTests : IDisposable
    {
        private readonly IMemoryCache _memoryCache;
        private readonly BrokerStatementSessionCache _sessionCache;

        public BrokerStatementSessionCacheTests()
        {
            _memoryCache = new MemoryCache(new MemoryCacheOptions());
            _sessionCache = new BrokerStatementSessionCache(_memoryCache);
        }

        public void Dispose()
        {
            _memoryCache.Dispose();
        }

        [Fact]
        public void Constructor_WithNullMemoryCache_ShouldThrowArgumentNullException()
        {
            // Act & Assert
            Assert.Throws<ArgumentNullException>(() => new BrokerStatementSessionCache(null!));
        }

        [Fact]
        public void SetSession_WithValidSession_ShouldStoreAndBeRetrievable()
        {
            // Arrange
            var sessionId = Guid.NewGuid();
            var analysisResult = new BrokerStatementAnalysisResultDto
            {
                SessionId = sessionId,
                BrokerAccountName = "ВТБ Основной",
                ImporterId = "vtb",
                TimeZoneId = "Europe/Moscow"
            };

            // Act
            _sessionCache.SetSession(analysisResult);
            var isFound = _sessionCache.TryGetSession(sessionId, out var retrievedSession);

            // Assert
            Assert.True(isFound);
            Assert.NotNull(retrievedSession);
            Assert.Equal(sessionId, retrievedSession.SessionId);
            Assert.Equal("ВТБ Основной", retrievedSession.BrokerAccountName);
        }

        [Fact]
        public void SetSession_WithNullSession_ShouldThrowArgumentNullException()
        {
            // Act & Assert
            Assert.Throws<ArgumentNullException>(() => _sessionCache.SetSession(null!));
        }

        [Fact]
        public void SetSession_WithEmptySessionId_ShouldThrowArgumentException()
        {
            // Arrange
            var analysisResult = new BrokerStatementAnalysisResultDto
            {
                SessionId = Guid.Empty
            };

            // Act & Assert
            Assert.Throws<ArgumentException>(() => _sessionCache.SetSession(analysisResult));
        }

        [Fact]
        public void TryGetSession_WithNonExistentId_ShouldReturnFalseAndNull()
        {
            // Arrange
            var unknownSessionId = Guid.NewGuid();

            // Act
            var isFound = _sessionCache.TryGetSession(unknownSessionId, out var session);

            // Assert
            Assert.False(isFound);
            Assert.Null(session);
        }

        [Fact]
        public void TryGetSession_WithEmptyGuid_ShouldReturnFalseAndNull()
        {
            // Act
            var isFound = _sessionCache.TryGetSession(Guid.Empty, out var session);

            // Assert
            Assert.False(isFound);
            Assert.Null(session);
        }

        [Fact]
        public void RemoveSession_WithExistingSession_ShouldRemoveFromCache()
        {
            // Arrange
            var sessionId = Guid.NewGuid();
            var analysisResult = new BrokerStatementAnalysisResultDto
            {
                SessionId = sessionId,
                BrokerAccountName = "Тестовый брокер"
            };

            _sessionCache.SetSession(analysisResult);
            Assert.True(_sessionCache.TryGetSession(sessionId, out _));

            // Act
            _sessionCache.RemoveSession(sessionId);

            // Assert
            var isFound = _sessionCache.TryGetSession(sessionId, out var retrievedSession);
            Assert.False(isFound);
            Assert.Null(retrievedSession);
        }

        [Fact]
        public void RemoveSession_WithEmptyGuid_ShouldNotThrowException()
        {
            // Act & Assert (should complete silently)
            _sessionCache.RemoveSession(Guid.Empty);
        }
    }
}
