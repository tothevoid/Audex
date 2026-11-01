using System;
using System.Threading;
using System.Threading.Tasks;
using Audex.Application.DTO.FileStorage;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.DatabaseBackup;
using Audex.Application.Interfaces.Scheduler;
using Audex.Application.Jobs;
using Audex.Application.Services.DatabaseBackup;
using Audex.Infrastructure.Entities.Scheduler;
using Audex.Infrastructure.Interfaces.Messages;
using Audex.Tests.Shared.Fixtures;
using Xunit;

namespace Audex.Application.Tests.Jobs
{
    public class ScheduledJobBaseTests
    {
        private class FakeSchedulerAttachmentService : ISchedulerAttachmentService
        {
            public ScheduledTaskAttachment? SavedAttachment { get; private set; }
            public Guid? SavedOccurrenceId { get; private set; }

            public Task<ScheduledTaskAttachment> SaveAttachmentAsync(Guid occurrenceId, ScheduledTaskAttachment attachment)
            {
                SavedOccurrenceId = occurrenceId;
                SavedAttachment = attachment;
                return Task.FromResult(attachment);
            }

            public Task<FileStreamDto> GetAttachmentFileStreamAsync(Guid attachmentId)
            {
                return Task.FromResult(new FileStreamDto());
            }
        }

        private class TestableJob : ScheduledJobBase
        {
            public bool CoreExecuted { get; private set; }
            public bool SuccessHookCalled { get; private set; }
            public bool FailureHookCalled { get; private set; }
            public bool CanceledHookCalled { get; private set; }
            public Exception? CapturedFailureException { get; private set; }
            public Func<CancellationToken, Task<JobExecutionResult>>? CustomCoreAction { get; set; }

            public TestableJob(
                IDatabaseStateService databaseStateService,
                ISchedulerAttachmentService attachmentService,
                IServerNotifier serverNotifier)
                : base(databaseStateService, attachmentService, serverNotifier)
            {
            }

            protected override async Task<JobExecutionResult> ExecuteCoreAsync(
                ScheduledTaskTriggerSource triggerSource,
                CancellationToken cancellationToken)
            {
                CoreExecuted = true;
                if (CustomCoreAction != null)
                {
                    return await CustomCoreAction(cancellationToken);
                }

                return JobExecutionResult.Success("Completed successfully");
            }

            protected override Task OnSuccessAsync(
                ScheduledTaskTriggerSource triggerSource,
                JobExecutionResult result,
                CancellationToken cancellationToken)
            {
                SuccessHookCalled = true;
                return Task.CompletedTask;
            }

            protected override Task OnFailureAsync(
                ScheduledTaskTriggerSource triggerSource,
                Exception exception,
                CancellationToken cancellationToken)
            {
                FailureHookCalled = true;
                CapturedFailureException = exception;
                return Task.CompletedTask;
            }

            protected override Task OnCanceledAsync(
                ScheduledTaskTriggerSource triggerSource,
                CancellationToken cancellationToken)
            {
                CanceledHookCalled = true;
                return Task.CompletedTask;
            }
        }

        [Fact]
        public async Task ExecuteAsync_WhenCancellationRequestedBeforeStart_ThrowsOperationCanceledExceptionAndDoesNotRunCore()
        {
            // Arrange
            var databaseStateService = new DatabaseStateService();
            var attachmentService = new FakeSchedulerAttachmentService();
            var serverNotifier = new TestServerNotifier();
            var job = new TestableJob(databaseStateService, attachmentService, serverNotifier);

            using var cancellationTokenSource = new CancellationTokenSource();
            cancellationTokenSource.Cancel();

            // Act & Assert
            await Assert.ThrowsAsync<OperationCanceledException>(() =>
                job.ExecuteAsync(ScheduledTaskTriggerSource.Manual, cancellationToken: cancellationTokenSource.Token));

            Assert.False(job.CoreExecuted);
            Assert.False(job.SuccessHookCalled);
            Assert.False(job.FailureHookCalled);
        }

        [Fact]
        public async Task ExecuteAsync_WhenCancellationRequestedDuringExecution_CallsOnCanceledAndDoesNotCallOnFailure()
        {
            // Arrange
            var databaseStateService = new DatabaseStateService();
            var attachmentService = new FakeSchedulerAttachmentService();
            var serverNotifier = new TestServerNotifier();
            var job = new TestableJob(databaseStateService, attachmentService, serverNotifier);

            using var cancellationTokenSource = new CancellationTokenSource();

            job.CustomCoreAction = async cancellationToken =>
            {
                await Task.Yield();
                cancellationTokenSource.Cancel();
                cancellationToken.ThrowIfCancellationRequested();
                return JobExecutionResult.Success();
            };

            // Act & Assert
            await Assert.ThrowsAsync<OperationCanceledException>(() =>
                job.ExecuteAsync(ScheduledTaskTriggerSource.Manual, cancellationToken: cancellationTokenSource.Token));

            Assert.True(job.CoreExecuted);
            Assert.True(job.CanceledHookCalled);
            Assert.False(job.FailureHookCalled);
            Assert.False(job.SuccessHookCalled);
        }

        [Fact]
        public async Task ExecuteAsync_WhenRegularExceptionOccurs_CallsOnFailureAndRethrows()
        {
            // Arrange
            var databaseStateService = new DatabaseStateService();
            var attachmentService = new FakeSchedulerAttachmentService();
            var serverNotifier = new TestServerNotifier();
            var job = new TestableJob(databaseStateService, attachmentService, serverNotifier);

            job.CustomCoreAction = cancellationToken =>
            {
                throw new InvalidOperationException("Something went wrong");
            };

            // Act & Assert
            var thrownException = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                job.ExecuteAsync(ScheduledTaskTriggerSource.Manual));

            Assert.Equal("Something went wrong", thrownException.Message);
            Assert.True(job.CoreExecuted);
            Assert.True(job.FailureHookCalled);
            Assert.False(job.CanceledHookCalled);
            Assert.False(job.SuccessHookCalled);
            Assert.Equal("Something went wrong", job.CapturedFailureException?.Message);
        }

        [Fact]
        public async Task ExecuteAsync_WhenSuccessful_CallsOnSuccess()
        {
            // Arrange
            var databaseStateService = new DatabaseStateService();
            var attachmentService = new FakeSchedulerAttachmentService();
            var serverNotifier = new TestServerNotifier();
            var job = new TestableJob(databaseStateService, attachmentService, serverNotifier);

            // Act
            await job.ExecuteAsync(ScheduledTaskTriggerSource.Manual);

            // Assert
            Assert.True(job.CoreExecuted);
            Assert.True(job.SuccessHookCalled);
            Assert.False(job.FailureHookCalled);
            Assert.False(job.CanceledHookCalled);
        }

        [Fact]
        public async Task ExecuteAsync_WhenDatabaseRestoring_ReturnsEarlyWithoutExecuting()
        {
            // Arrange
            var databaseStateService = new DatabaseStateService();
            using var restoreScope = await databaseStateService.BeginRestoreScopeAsync();
            var attachmentService = new FakeSchedulerAttachmentService();
            var serverNotifier = new TestServerNotifier();
            var job = new TestableJob(databaseStateService, attachmentService, serverNotifier);

            // Act
            await job.ExecuteAsync(ScheduledTaskTriggerSource.Manual);

            // Assert
            Assert.False(job.CoreExecuted);
            Assert.False(job.SuccessHookCalled);
            Assert.False(job.FailureHookCalled);
            Assert.False(job.CanceledHookCalled);
        }
    }
}
