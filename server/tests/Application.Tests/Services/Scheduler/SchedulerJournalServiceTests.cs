using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.Scheduler;
using Audex.Application.Tests.Fixtures;
using Audex.Infrastructure.Entities.Scheduler;
using Audex.Infrastructure.Interfaces.Database;
using Audex.Shared.Common;
using TickerQ.Utilities.Entities;
using Xunit;

namespace Audex.Application.Tests.Services.Scheduler
{
    public class SchedulerJournalServiceTests : TestBase
    {
        public SchedulerJournalServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task GetJournalAsync_WorksCorrectly()
        {
            await ExecuteScopeAsync(async serviceProvider =>
            {
                var taskService = serviceProvider.GetRequiredService<ISchedulerTaskService>();
                var journalService = serviceProvider.GetRequiredService<ISchedulerJournalService>();
                var unitOfWork = serviceProvider.GetRequiredService<IUnitOfWork>();
                var occurrenceRepo = unitOfWork.CreateRepository<CronTickerOccurrenceEntity<ScheduledCronTicker>>();
                var tickerRepo = unitOfWork.CreateRepository<ScheduledCronTicker>();
                var attachmentService = serviceProvider.GetRequiredService<ISchedulerAttachmentService>();

                await taskService.CreateTaskAsync(new CreateScheduledTaskDto
                {
                    TaskName = "GenerateAllAssetsReport",
                    CronExpression = "0 0 * * *",
                    IsEnabled = true
                });

                var ticker = await tickerRepo.FindAsync(tickerEntity => tickerEntity.Function == "GenerateAllAssetsReport");
                Assert.NotNull(ticker);

                var occurrenceId = Guid.NewGuid();
                var occurrence = new CronTickerOccurrenceEntity<ScheduledCronTicker>
                {
                    Id = occurrenceId,
                    CronTickerId = ticker.Id,
                    ExecutionTime = DateTime.UtcNow,
                    ExecutedAt = DateTime.UtcNow,
                    ElapsedTime = 150,
                    Status = TickerQ.Utilities.Enums.TickerStatus.Done,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };

                await occurrenceRepo.AddAsync(occurrence);
                await unitOfWork.CommitAsync();

                var attachment = new ScheduledTaskAttachment
                {
                    Id = Guid.NewGuid(),
                    OccurrenceId = occurrenceId,
                    FileName = "TestReport.xlsx",
                    BucketName = "reports",
                    StoragePath = "TestReport.xlsx",
                    ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    FileSizeBytes = 1024,
                    CreatedAt = DateTime.UtcNow
                };

                await attachmentService.SaveAttachmentAsync(occurrenceId, attachment);

                var journal = await journalService.GetJournalAsync(new SchedulerJournalFilterDto
                {
                    TaskName = "GenerateAllAssetsReport",
                    Status = ScheduledTaskExecutionStatus.Done,
                    PageIndex = 1,
                    RecordsQuantity = 10
                });

                Assert.NotNull(journal);
                Assert.True(journal.TotalCount > 0);
                Assert.NotEmpty(journal.Items);

                var entry = journal.Items.FirstOrDefault(item => item.Id == occurrenceId);
                Assert.NotNull(entry);
                Assert.Equal(ScheduledTaskExecutionStatus.Done, entry.Status);
                Assert.NotEmpty(entry.Attachments);
            });
        }
    }
}
