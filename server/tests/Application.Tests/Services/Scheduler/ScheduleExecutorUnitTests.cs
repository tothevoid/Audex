using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging.Abstractions;
using Audex.Application.DTO.Scheduler;
using Audex.Application.Enums.Scheduler;
using Audex.Application.Interfaces.Scheduler;
using Audex.Application.Services.Scheduler;
using Audex.Infrastructure.Entities.Scheduler;
using Audex.Infrastructure.Interfaces.Database;
using Audex.Infrastructure.Queries;
using Audex.Shared.Common;
using TickerQ.Utilities.Entities;
using TickerQ.Utilities.Enums;
using Xunit;

namespace Audex.Application.Tests.Services.Scheduler
{
    public class ScheduleExecutorUnitTests
    {
        private class FakeRepository<TEntity> : IRepository<TEntity> where TEntity : class
        {
            public List<TEntity> Items { get; } = new();

            public Task AddAsync(TEntity entity)
            {
                Items.Add(entity);
                return Task.CompletedTask;
            }

            public Task AddRangeAsync(IEnumerable<TEntity> entities)
            {
                Items.AddRange(entities);
                return Task.CompletedTask;
            }

            public Task<TEntity> FindAsync(
                Expression<Func<TEntity, bool>> predicate,
                Func<IQueryable<TEntity>, IQueryable<TEntity>>? include = null,
                bool disableTracking = true)
            {
                var compiledPredicate = predicate.Compile();
                var result = Items.FirstOrDefault(compiledPredicate);
                return Task.FromResult(result!);
            }

            public void Update(TEntity entity)
            {
            }

            public Task DeleteAsync(Guid id) => Task.CompletedTask;

            public Task<TEntity> GetByIdAsync(Guid id, Func<IQueryable<TEntity>, IQueryable<TEntity>>? include = null, bool disableTracking = true) =>
                Task.FromResult<TEntity>(null!);

            public Task<IEnumerable<TEntity>> GetAllAsync(Expression<Func<TEntity, bool>>? filter = null, Func<IQueryable<TEntity>, IQueryable<TEntity>>? include = null, bool disableTracking = true) =>
                Task.FromResult<IEnumerable<TEntity>>(Items);

            public Task<IEnumerable<TEntity>> GetAllAsync(ComplexQuery<TEntity> complexQuery) =>
                Task.FromResult<IEnumerable<TEntity>>(Items);

            public Task<PagedResult<TEntity>> GetPagedAsync(ComplexQuery<TEntity> complexQuery) =>
                Task.FromResult(new PagedResult<TEntity>());

            public Task<IEnumerable<TOutput>> GroupAsync<TKeySelector, TOutput>(Expression<Func<TEntity, TKeySelector>> groupSelector, Expression<Func<IGrouping<TKeySelector, TEntity>, TOutput>> projection, Expression<Func<TEntity, bool>>? filter = null) =>
                Task.FromResult(Enumerable.Empty<TOutput>());

            public Task<int> GetCountAsync(Expression<Func<TEntity, bool>>? filter = null) => Task.FromResult(Items.Count);
            public Task<int> GetCountAsync(ComplexQuery<TEntity> complexQuery) => Task.FromResult(Items.Count);
            public Task<TEntity> GetMinAsync(Expression<Func<TEntity, object>> sortField, Expression<Func<TEntity, bool>>? filter = null) => Task.FromResult<TEntity>(null!);
            public Task<TEntity> GetMaxAsync(Expression<Func<TEntity, object>> sortField, Expression<Func<TEntity, bool>>? filter = null) => Task.FromResult<TEntity>(null!);
            public Task<decimal> GetSumAsync(Expression<Func<TEntity, decimal>> projection, Expression<Func<TEntity, bool>>? filter = null) => Task.FromResult(0m);
            public void Dispose() { }
        }

        private class FakeUnitOfWork : IUnitOfWork
        {
            private readonly Dictionary<Type, object> _repositories = new();
            public int CommitCallsCount { get; private set; }

            public void RegisterRepository<TEntity>(IRepository<TEntity> repository) where TEntity : class
            {
                _repositories[typeof(TEntity)] = repository;
            }

            public IRepository<TEntity> CreateRepository<TEntity>() where TEntity : class
            {
                return (IRepository<TEntity>)_repositories[typeof(TEntity)];
            }

            public Task CommitAsync()
            {
                CommitCallsCount++;
                return Task.CompletedTask;
            }

            public void Dispose() { }
        }

        private class FakeScheduledJobRegistry : IScheduledJobRegistry
        {
            private readonly Dictionary<string, ScheduledJobDescriptor> _descriptors = new(StringComparer.OrdinalIgnoreCase);

            public void Register(ScheduledJobDescriptor descriptor)
            {
                _descriptors[descriptor.TaskName] = descriptor;
            }

            public IReadOnlyList<ScheduledJobDescriptor> GetAllDescriptors() => _descriptors.Values.ToList();

            public ScheduledJobDescriptor GetDescriptor(string taskName) => _descriptors[taskName];

            public bool TryGetDescriptor(string taskName, out ScheduledJobDescriptor descriptor) =>
                _descriptors.TryGetValue(taskName, out descriptor!);
        }

        private class FakeJob : IScheduledJob
        {
            public Func<CancellationToken, Task>? ExecutionHandler { get; set; }

            public async Task ExecuteAsync(
                ScheduledTaskTriggerSource triggerSource = ScheduledTaskTriggerSource.Manual,
                CancellationToken cancellationToken = default,
                Guid? occurrenceId = null)
            {
                if (ExecutionHandler != null)
                {
                    await ExecutionHandler(cancellationToken);
                }
            }
        }

        private static ScheduledJobDescriptor CreateTestDescriptor(string taskName = "TestTask")
        {
            return new ScheduledJobDescriptor(
                JobType: typeof(FakeJob),
                TaskName: taskName,
                DisplayNameKey: "DisplayNameKey",
                DescriptionKey: "DescriptionKey",
                CategoryKey: "CategoryKey",
                DefaultCronExpression: "* * * * *");
        }

        [Fact]
        public async Task ExecuteJobAsync_WhenCancellationRequestedBeforeStart_ThrowsOperationCanceledExceptionAndDoesNotAddOccurrence()
        {
            // Arrange
            var unitOfWork = new FakeUnitOfWork();
            var tickerRepository = new FakeRepository<ScheduledCronTicker>();
            var occurrenceRepository = new FakeRepository<CronTickerOccurrenceEntity<ScheduledCronTicker>>();
            unitOfWork.RegisterRepository(tickerRepository);
            unitOfWork.RegisterRepository(occurrenceRepository);

            var jobRegistry = new FakeScheduledJobRegistry();
            var job = new FakeJob();

            jobRegistry.Register(CreateTestDescriptor("TestTask"));

            tickerRepository.Items.Add(new ScheduledCronTicker
            {
                Id = Guid.NewGuid(),
                Function = "TestTask",
                Expression = "* * * * *"
            });

            var executor = new ScheduleExecutor(
                unitOfWork,
                jobRegistry,
                new IScheduledJob[] { job },
                NullLogger<ScheduleExecutor>.Instance);

            using var cancellationTokenSource = new CancellationTokenSource();
            cancellationTokenSource.Cancel();

            // Act & Assert
            await Assert.ThrowsAsync<OperationCanceledException>(() =>
                executor.ExecuteJobAsync("TestTask", ScheduledTaskTriggerSource.Manual, cancellationToken: cancellationTokenSource.Token));

            Assert.Empty(occurrenceRepository.Items);
        }

        [Fact]
        public async Task ExecuteJobAsync_WhenCancellationRequestedDuringExecution_UpdatesStatusToCancelledAndRethrows()
        {
            // Arrange
            var unitOfWork = new FakeUnitOfWork();
            var tickerRepository = new FakeRepository<ScheduledCronTicker>();
            var occurrenceRepository = new FakeRepository<CronTickerOccurrenceEntity<ScheduledCronTicker>>();
            unitOfWork.RegisterRepository(tickerRepository);
            unitOfWork.RegisterRepository(occurrenceRepository);

            var jobRegistry = new FakeScheduledJobRegistry();
            var job = new FakeJob();

            jobRegistry.Register(CreateTestDescriptor("TestTask"));

            tickerRepository.Items.Add(new ScheduledCronTicker
            {
                Id = Guid.NewGuid(),
                Function = "TestTask",
                Expression = "* * * * *"
            });

            var executor = new ScheduleExecutor(
                unitOfWork,
                jobRegistry,
                new IScheduledJob[] { job },
                NullLogger<ScheduleExecutor>.Instance);

            using var cancellationTokenSource = new CancellationTokenSource();

            job.ExecutionHandler = async cancellationToken =>
            {
                await Task.Yield();
                cancellationTokenSource.Cancel();
                cancellationToken.ThrowIfCancellationRequested();
            };

            // Act & Assert
            await Assert.ThrowsAsync<OperationCanceledException>(() =>
                executor.ExecuteJobAsync("TestTask", ScheduledTaskTriggerSource.Manual, cancellationToken: cancellationTokenSource.Token));

            var recordedOccurrence = Assert.Single(occurrenceRepository.Items);
            Assert.Equal(TickerStatus.Cancelled, recordedOccurrence.Status);
            Assert.Equal("The operation was canceled.", recordedOccurrence.ExceptionMessage);
        }

        [Fact]
        public async Task ExecuteJobAsync_WhenRegularExceptionOccurs_UpdatesStatusToFailedAndRethrows()
        {
            // Arrange
            var unitOfWork = new FakeUnitOfWork();
            var tickerRepository = new FakeRepository<ScheduledCronTicker>();
            var occurrenceRepository = new FakeRepository<CronTickerOccurrenceEntity<ScheduledCronTicker>>();
            unitOfWork.RegisterRepository(tickerRepository);
            unitOfWork.RegisterRepository(occurrenceRepository);

            var jobRegistry = new FakeScheduledJobRegistry();
            var job = new FakeJob();

            jobRegistry.Register(CreateTestDescriptor("TestTask"));

            tickerRepository.Items.Add(new ScheduledCronTicker
            {
                Id = Guid.NewGuid(),
                Function = "TestTask",
                Expression = "* * * * *"
            });

            var executor = new ScheduleExecutor(
                unitOfWork,
                jobRegistry,
                new IScheduledJob[] { job },
                NullLogger<ScheduleExecutor>.Instance);

            job.ExecutionHandler = cancellationToken =>
            {
                throw new InvalidOperationException("Failed database operation");
            };

            // Act & Assert
            var thrownException = await Assert.ThrowsAsync<InvalidOperationException>(() =>
                executor.ExecuteJobAsync("TestTask", ScheduledTaskTriggerSource.Manual));

            Assert.Equal("Failed database operation", thrownException.Message);
            var recordedOccurrence = Assert.Single(occurrenceRepository.Items);
            Assert.Equal(TickerStatus.Failed, recordedOccurrence.Status);
            Assert.Equal("Failed database operation", recordedOccurrence.ExceptionMessage);
        }

        [Fact]
        public async Task ExecuteJobAsync_WhenExecutionSucceeds_UpdatesStatusToDone()
        {
            // Arrange
            var unitOfWork = new FakeUnitOfWork();
            var tickerRepository = new FakeRepository<ScheduledCronTicker>();
            var occurrenceRepository = new FakeRepository<CronTickerOccurrenceEntity<ScheduledCronTicker>>();
            unitOfWork.RegisterRepository(tickerRepository);
            unitOfWork.RegisterRepository(occurrenceRepository);

            var jobRegistry = new FakeScheduledJobRegistry();
            var job = new FakeJob();

            jobRegistry.Register(CreateTestDescriptor("TestTask"));

            tickerRepository.Items.Add(new ScheduledCronTicker
            {
                Id = Guid.NewGuid(),
                Function = "TestTask",
                Expression = "* * * * *"
            });

            var executor = new ScheduleExecutor(
                unitOfWork,
                jobRegistry,
                new IScheduledJob[] { job },
                NullLogger<ScheduleExecutor>.Instance);

            // Act
            await executor.ExecuteJobAsync("TestTask", ScheduledTaskTriggerSource.Manual);

            // Assert
            var recordedOccurrence = Assert.Single(occurrenceRepository.Items);
            Assert.Equal(TickerStatus.Done, recordedOccurrence.Status);
            Assert.Null(recordedOccurrence.ExceptionMessage);
        }
    }
}
