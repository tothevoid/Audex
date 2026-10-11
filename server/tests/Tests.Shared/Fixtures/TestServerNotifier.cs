#nullable enable
using System.Threading.Tasks;
using Audex.Infrastructure.Interfaces.Messages;

namespace Audex.Tests.Shared.Fixtures
{
    public class TestServerNotifier : IServerNotifier
    {
        public Task SendToAllAsync(string eventName)
        {
            return Task.CompletedTask;
        }

        public Task SendToAllAsync<TPayload>(string eventName, TPayload payload)
        {
            return Task.CompletedTask;
        }
    }
}
