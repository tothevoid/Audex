using System;
using System.Linq.Expressions;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using Microsoft.EntityFrameworkCore;
using Audex.Shared.Entities;
using Audex.Infrastructure.Interfaces.Database;
using Audex.Infrastructure.Migrations;
using Audex.Infrastructure.Queries;

namespace Audex.Infrastructure.Database
{
    public class Repository<TEntity>: IRepository<TEntity>
        where TEntity: class
    {
        private readonly ApplicationDbContext _context;
        private readonly DbSet<TEntity> _entities;

        public Repository(ApplicationDbContext context)
        {
            _context = context;
            _entities = context.Set<TEntity>();
        }

        public async Task AddAsync(TEntity entity)
        {
            await _entities.AddAsync(entity);
        }

        public async Task<TEntity> GetByIdAsync(Guid id,
            Func<IQueryable<TEntity>, IQueryable<TEntity>> include = null,
            bool disableTracking = true)
        {
            IQueryable<TEntity> query =
                disableTracking ? _entities.AsQueryable().AsNoTracking() : _entities.AsQueryable();

            if (include != null)
            {
                query = include(query);
            }

            return await query.Where(entity => EF.Property<Guid>(entity, "Id") == id).FirstOrDefaultAsync();
        }

        public async Task<TEntity> FindAsync(
            Expression<Func<TEntity, bool>> predicate,
            Func<IQueryable<TEntity>, IQueryable<TEntity>> include = null,
            bool disableTracking = true)
        {
            IQueryable<TEntity> query =
                disableTracking ? _entities.AsQueryable().AsNoTracking() : _entities.AsQueryable();

            if (include != null)
            {
                query = include(query);
            }

            return await query.Where(predicate).FirstOrDefaultAsync();
        }

        public async Task<IEnumerable<Output>> GroupAsync<TKey, Output>(
            Expression<Func<TEntity, TKey>> groupSelector,
            Expression<Func<IGrouping<TKey, TEntity>, Output>> projection,
            Expression<Func<TEntity, bool>> filter = null)
        {
            IQueryable<TEntity> query = _entities.AsNoTracking();
            if (filter != null)
            {
                query = query.Where(filter);
            }

            return await query.GroupBy(groupSelector).Select(projection).ToListAsync();
        }

        public async Task<IEnumerable<TEntity>> GetAllAsync(Expression<Func<TEntity, bool>> filter = null,
            Func<IQueryable<TEntity>, IQueryable<TEntity>> include = null,
            bool disableTracking = true)
        {
            IQueryable<TEntity> query =
                disableTracking ? _entities.AsQueryable().AsNoTracking() : _entities.AsQueryable();

            if (include != null)
            {
                query = include(query);
            }

            if (filter != null)
            {
                query = query.Where(filter);
            }

            return await query.ToListAsync();
        }

        public async Task<IEnumerable<TEntity>> GetAllAsync(ComplexQuery<TEntity> complexQuery)
        {
            IQueryable<TEntity> query =
                complexQuery.TrackingEnabled ? _entities.AsQueryable() : _entities.AsQueryable().AsNoTracking();

            foreach (var filter in complexQuery.Filters)
            {
                query = query.Where(filter);
            }

            while (complexQuery.OrderByExpressions.Count > 0)
            {
                var orderBy = complexQuery.OrderByExpressions.Dequeue();
                query = orderBy.IsDescending ? 
                    query.OrderByDescending(orderBy.Expression): 
                    query.OrderBy(orderBy.Expression);
            }

            if (complexQuery.RecordsOffset > 0)
            {
                query = query.Skip(complexQuery.RecordsOffset);
            }

            if (complexQuery.RecordsLimit > 0)
            {
                query = query.Take(complexQuery.RecordsLimit);
            }

            if (complexQuery.Joins != null)
            {
                query = complexQuery.Joins(query);
            }

            return await query.ToListAsync();
        }

        public async Task<int> GetCountAsync(Expression<Func<TEntity, bool>> filter = null)
        {
            IQueryable<TEntity> query = _entities.AsQueryable().AsNoTracking();

            if (filter != null)
            {
                query = query.Where(filter);
            }

            return await query.CountAsync();
        }

        public void Update(TEntity entity)
        {
            var entry = _context.Entry(entity);
            if (entry.State == EntityState.Detached)
            {
                _entities.Attach(entity);
            }
            entry.State = EntityState.Modified;
        }

        public async Task DeleteAsync(Guid id)
        {
            var entity = await _entities.FirstOrDefaultAsync(entity => EF.Property<Guid>(entity, "Id") == id);

            if (entity == null)
            {
                return;
            }

            _entities.Remove(entity);
        }

        public async Task<TEntity> GetMinAsync(Expression<Func<TEntity, object>> sortField)
        {
            IQueryable<TEntity> query = _entities.AsNoTracking();
            return await query.OrderBy(sortField).Take(1).FirstOrDefaultAsync();
        }

        public async Task<TEntity> GetMaxAsync(Expression<Func<TEntity, object>> sortField)
        {
            IQueryable<TEntity> query = _entities.AsNoTracking();
            return await query.OrderByDescending(sortField).Take(1).FirstOrDefaultAsync();
        }

        public async Task<decimal> GetSumAsync(Expression<Func<TEntity, decimal>> projection, 
            Expression<Func<TEntity, bool>> filter = null)
        {
            IQueryable<TEntity> query = _entities.AsNoTracking();
            if (filter != null)
            {
                query = query.Where(filter);
            }

            return await query.SumAsync(projection);
        }

        public async Task SaveChangesAsync() => await _context.SaveChangesAsync();

        public void Dispose()
        {
            GC.SuppressFinalize(this);
        }
    }
}