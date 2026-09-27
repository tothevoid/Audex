using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.Localization;
using Audex.Application.Interfaces.Scheduler;
using Audex.Application.Utilities.Scheduler;
using Audex.Infrastructure.Entities.Scheduler;
using Audex.Infrastructure.Interfaces.Database;
using Audex.Infrastructure.Queries;
using Audex.Shared.Common;
using TickerQ.Utilities.Entities;
using TickerQ.Utilities.Enums;

namespace Audex.Application.Services.Scheduler
{
    public class SchedulerJournalService : ISchedulerJournalService
    {
        private readonly IRepository<CronTickerOccurrenceEntity<ScheduledCronTicker>> _occurrenceRepo;
        private readonly IRepository<ScheduledTaskAttachment> _attachmentRepo;
        private readonly IScheduledJobRegistry _jobRegistry;
        private readonly ILocalizationService _localizer;
        private readonly ILogger<SchedulerJournalService> _logger;

        public SchedulerJournalService(
            IUnitOfWork unitOfWork,
            IScheduledJobRegistry jobRegistry,
            ILocalizationService localizer,
            ILogger<SchedulerJournalService> logger)
        {
            _occurrenceRepo = unitOfWork.CreateRepository<CronTickerOccurrenceEntity<ScheduledCronTicker>>();
            _attachmentRepo = unitOfWork.CreateRepository<ScheduledTaskAttachment>();
            _jobRegistry = jobRegistry;
            _localizer = localizer;
            _logger = logger;
        }

        public async Task<PagedResult<ScheduledTaskJournalDto>> GetJournalAsync(SchedulerJournalFilterDto filter)
        {
            var language = await _localizer.GetUserLanguageAsync();

            var builder = new ComplexQueryBuilder<CronTickerOccurrenceEntity<ScheduledCronTicker>>()
                .AddJoins(query => query.Include(occurrence => occurrence.CronTicker))
                .AddFilter(GetFilter(filter.TaskName, filter.Status))
                .AddPagination(filter, occurrence => occurrence.ExecutionTime, isDescending: true);

            var pagedOccurrences = await _occurrenceRepo.GetPagedAsync(builder.GetQuery());
            var occurrenceList = pagedOccurrences.Items.ToList();
            var occurrenceIds = occurrenceList.Select(occurrence => occurrence.Id).ToHashSet();

            var attachments = await _attachmentRepo.GetAllAsync(
                filter: attachment => occurrenceIds.Contains(attachment.OccurrenceId),
                disableTracking: true);

            var attachmentMap = attachments
                .GroupBy(attachment => attachment.OccurrenceId)
                .ToDictionary(group => group.Key, group => group.Select(MapAttachmentDto).ToList());

            var items = occurrenceList.Select(occurrence =>
            {
                var functionName = occurrence.CronTicker?.Function ?? "ScheduledTask";
                var displayName = _jobRegistry.TryGetDescriptor(functionName, out var jobDescriptor) && !string.IsNullOrWhiteSpace(jobDescriptor.DisplayNameKey)
                    ? _localizer.Get(jobDescriptor.DisplayNameKey, language)
                    : functionName;

                return new ScheduledTaskJournalDto
                {
                    Id = occurrence.Id,
                    TaskName = functionName,
                    DisplayName = displayName,
                    ExecutedAtUtc = occurrence.ExecutedAt ?? occurrence.ExecutionTime,
                    DurationMs = occurrence.ElapsedTime,
                    Status = SchedulerStatusMapper.ToExecutionStatus(occurrence.Status),
                    TriggerSource = filter.TriggerSource ?? ScheduledTaskTriggerSource.Scheduled,
                    LogMessage = null,
                    ErrorMessage = occurrence.ExceptionMessage,
                    Attachments = attachmentMap.TryGetValue(occurrence.Id, out var taskAttachments) ? taskAttachments : new List<ScheduledTaskAttachmentDto>()
                };
            }).ToList();

            return new PagedResult<ScheduledTaskJournalDto>
            {
                Items = items,
                TotalCount = pagedOccurrences.TotalCount,
                PageIndex = pagedOccurrences.PageIndex,
                PageSize = pagedOccurrences.PageSize
            };
        }

        private static Expression<Func<CronTickerOccurrenceEntity<ScheduledCronTicker>, bool>> GetFilter(
            string taskName,
            ScheduledTaskExecutionStatus? status)
        {
            var hasTask = !string.IsNullOrWhiteSpace(taskName) && taskName != "All";

            if (!status.HasValue || status.Value == ScheduledTaskExecutionStatus.Unknown)
            {
                return occurrence => !hasTask || occurrence.CronTicker.Function == taskName;
            }

            var targetTickerStatus = SchedulerStatusMapper.ToTickerStatus(status.Value);

            if (status.Value == ScheduledTaskExecutionStatus.Done)
            {
                return occurrence => (!hasTask || occurrence.CronTicker.Function == taskName) &&
                    (occurrence.Status == TickerStatus.Done || occurrence.Status == TickerStatus.DueDone);
            }

            return occurrence => (!hasTask || occurrence.CronTicker.Function == taskName) && occurrence.Status == targetTickerStatus;
        }

        private static ScheduledTaskAttachmentDto MapAttachmentDto(ScheduledTaskAttachment entity)
        {
            return new ScheduledTaskAttachmentDto
            {
                Id = entity.Id,
                OccurrenceId = entity.OccurrenceId,
                FileName = entity.FileName,
                BucketName = entity.BucketName,
                StoragePath = entity.StoragePath,
                ContentType = entity.ContentType,
                FileSizeBytes = entity.FileSizeBytes,
                CreatedAt = entity.CreatedAt
            };
        }
    }
}
