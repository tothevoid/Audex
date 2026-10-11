#nullable enable
using System.Threading.Tasks;

namespace Audex.Infrastructure.Interfaces.Messages
{
    public interface IServerNotifier
    {
        Task SendToAllAsync(string eventName);
        Task SendToAllAsync<TPayload>(string eventName, TPayload payload);
    }
}
