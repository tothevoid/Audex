using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Audex.Infrastructure.Queries;
using Audex.Shared.Entities;

namespace Audex.Infrastructure.Interfaces.Database
{
    public interface IRepository<TEntity>: IDisposable
        where TEntity: class
    {
        Task AddAsync(TEntity entity);

        Task<TEntity> GetByIdAsync(Guid id,
            Func<IQueryable<TEntity>, IQueryable<TEntity>> include = null,
            bool disableTracking = true);

        Task<IEnumerable<TEntity>> GetAllAsync(Expression<Func<TEntity, bool>> filter = null,
            Func<IQueryable<TEntity>, IQueryable<TEntity>> include = null,
            bool disableTracking = true);
        Task<IEnumerable<TEntity>> GetAllAsync(ComplexQuery<TEntity> complexQuery);

        Task<IEnumerable<Output>> GroupAsync<KeySelector, Output>(Expression<Func<TEntity, KeySelector>> groupSelector,
            Expression<Func<IGrouping<KeySelector, TEntity>, Output>> projection,
            Expression<Func<TEntity, bool>> filter = null);

        Task<int> GetCountAsync(Expression<Func<TEntity, bool>> filter = null);
        Task<int> GetCountAsync(ComplexQuery<TEntity> complexQuery);

        Task<TEntity> FindAsync(Expression<Func<TEntity, bool>> predicate,
            Func<IQueryable<TEntity>, IQueryable<TEntity>> include = null,
            bool disableTracking = true);

        void Update(TEntity entity);

        Task DeleteAsync(Guid id);

        Task<TEntity> GetMinAsync(Expression<Func<TEntity, object>> sortField);

        Task<TEntity> GetMaxAsync(Expression<Func<TEntity, object>> sortField);

        Task<decimal> GetSumAsync(Expression<Func<TEntity, decimal>> projection,
            Expression<Func<TEntity, bool>> filter = null);
    }
}