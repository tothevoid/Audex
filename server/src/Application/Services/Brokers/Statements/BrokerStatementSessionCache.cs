#nullable enable
using System;
using System.Diagnostics.CodeAnalysis;
using Microsoft.Extensions.Caching.Memory;
using Audex.Application.DTO.Brokers.Statements;
using Audex.Application.Interfaces.Brokers.Statements;

namespace Audex.Application.Services.Brokers.Statements
{
    public class BrokerStatementSessionCache : IBrokerStatementSessionCache
    {
        private static readonly TimeSpan DefaultSessionDuration = TimeSpan.FromMinutes(30);

        private readonly IMemoryCache _memoryCache;

        public BrokerStatementSessionCache(IMemoryCache memoryCache)
        {
            _memoryCache = memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));
        }

        public void SetSession(BrokerStatementAnalysisResultDto session)
        {
            ArgumentNullException.ThrowIfNull(session);

            if (session.SessionId == Guid.Empty)
            {
                throw new ArgumentException("Session ID cannot be empty.", nameof(session));
            }

            var cacheKey = GetCacheKey(session.SessionId);
            _memoryCache.Set(cacheKey, session, DefaultSessionDuration);
        }

        public bool TryGetSession(Guid sessionId, [NotNullWhen(true)] out BrokerStatementAnalysisResultDto? session)
        {
            if (sessionId == Guid.Empty)
            {
                session = null;
                return false;
            }

            var cacheKey = GetCacheKey(sessionId);
            if (_memoryCache.TryGetValue(cacheKey, out BrokerStatementAnalysisResultDto? cachedSession) && cachedSession != null)
            {
                session = cachedSession;
                return true;
            }

            session = null;
            return false;
        }

        public void RemoveSession(Guid sessionId)
        {
            if (sessionId == Guid.Empty)
            {
                return;
            }

            var cacheKey = GetCacheKey(sessionId);
            _memoryCache.Remove(cacheKey);
        }

        private static string GetCacheKey(Guid sessionId) => $"broker_statement_session_{sessionId:N}";
    }
}
