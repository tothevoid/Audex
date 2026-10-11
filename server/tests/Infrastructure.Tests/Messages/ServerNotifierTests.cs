#nullable enable
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;
using Audex.Infrastructure.Messages;
using NSubstitute;
using Xunit;

namespace Audex.Infrastructure.Tests.Messages
{
    public class ServerNotifierTests
    {
        private readonly IHubContext<ServerMessagesHub> _mockHubContext;
        private readonly IClientProxy _mockClientProxy;
        private readonly ServerNotifier _serverNotifier;

        public ServerNotifierTests()
        {
            _mockHubContext = Substitute.For<IHubContext<ServerMessagesHub>>();
            var mockClients = Substitute.For<IHubClients>();
            _mockClientProxy = Substitute.For<IClientProxy>();

            _mockHubContext.Clients.Returns(mockClients);
            mockClients.All.Returns(_mockClientProxy);

            _serverNotifier = new ServerNotifier(_mockHubContext);
        }

        [Fact]
        public async Task SendToAllAsync_WithGenericPayload_CallsSignalRWithEventNameAndPayload()
        {
            var eventName = "NotificationReceived";
            var payload = new { id = "123", title = "Alert" };

            await _serverNotifier.SendToAllAsync(eventName, payload);

            await _mockClientProxy.Received(1).SendCoreAsync(
                eventName,
                Arg.Is<object?[]>(arguments => arguments.Length == 1 && arguments[0] == payload),
                Arg.Any<CancellationToken>()
            );
        }

        [Fact]
        public async Task SendToAllAsync_Parameterless_CallsSignalRWithEventNameOnly()
        {
            var eventName = "AllNotificationsRead";

            await _serverNotifier.SendToAllAsync(eventName);

            await _mockClientProxy.Received(1).SendCoreAsync(
                eventName,
                Arg.Is<object?[]>(arguments => arguments.Length == 0),
                Arg.Any<CancellationToken>()
            );
        }
    }
}
