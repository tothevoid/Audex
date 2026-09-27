using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Audex.Application.Interfaces.Notifications;
using Audex.Shared.Common;
using Audex.WebApi.Mappings;
using Audex.WebApi.Models.Common;
using Audex.WebApi.Models.Notifications;

namespace Audex.WebApi.Controllers.Notifications
{
    [Produces("application/json")]
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        private readonly WebApiMapper _mapper;

        public NotificationController(INotificationService notificationService, WebApiMapper mapper)
        {
            _notificationService = notificationService;
            _mapper = mapper;
        }

        [HttpPost(nameof(GetAll))]
        public async Task<PagedResult<NotificationModel>> GetAll(GetAllNotificationsQuery query)
        {
            var filter = _mapper.Map(query);
            var pagedResult = await _notificationService.GetAllAsync(filter);
            return _mapper.Map(pagedResult);
        }

        [HttpGet("unread-count")]
        public async Task<int> GetUnreadCount()
        {
            return await _notificationService.GetUnreadCountAsync();
        }

        [HttpPost("{id}/read")]
        public async Task MarkAsRead(Guid id)
        {
            await _notificationService.MarkAsReadAsync(id);
        }

        [HttpPost("read-all")]
        public async Task MarkAllAsRead()
        {
            await _notificationService.MarkAllAsReadAsync();
        }

        [HttpDelete]
        public async Task Delete(Guid id)
        {
            await _notificationService.DeleteAsync(id);
        }
    }
}
