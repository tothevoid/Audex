using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Audex.Infrastructure.Interfaces.Database;
using Audex.Shared.Entities;

namespace Audex.Infrastructure.Database
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly ApplicationDbContext _applicationDbContext;
        private bool _disposed;
        private Dictionary<string, object> _repositories;

        public UnitOfWork(ApplicationDbContext applicationDbContext)
        {
            _applicationDbContext = applicationDbContext;
        }

        public IRepository<T> CreateRepository<T>()
            where T : class
        {
            _repositories ??= new Dictionary<string, object>();

            var type = typeof(T).Name;

            if (_repositories.ContainsKey(type)) return (Repository<T>)_repositories[type];

            var repositoryType = typeof(Repository<>);
            var repositoryInstance = Activator.CreateInstance(repositoryType.MakeGenericType(typeof(T)), 
                _applicationDbContext);
            _repositories.Add(type, repositoryInstance);
            return (Repository<T>)_repositories[type];
        }

        public async Task CommitAsync()
        {
            await _applicationDbContext.SaveChangesAsync();
            _applicationDbContext.ChangeTracker.Clear();
        }

        public void Dispose(bool disposing)
        {
            if (_disposed) return;

            if (disposing)
            {
                _applicationDbContext.Dispose();
            }
            _disposed = true;
        }
    }
}