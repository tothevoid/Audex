using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using Audex.Shared.Entities;

namespace Audex.Infrastructure.Queries
{
    public class ComplexQueryBuilder<TEntity>
        where TEntity: class
    {
        private readonly ComplexQuery<TEntity> _complexQuery = new();

        public ComplexQueryBuilder<TEntity> AddFilter(Expression<Func<TEntity, bool>> filter)
        {
            if (filter != null)
            {
                _complexQuery.Filters.Add(filter);
            }

            return this;
        }

        public ComplexQueryBuilder<TEntity> AddJoins(Func<IQueryable<TEntity>, IQueryable<TEntity>> joins)
        {
            _complexQuery.Joins = joins;
            return this;
        }

        public ComplexQueryBuilder<TEntity> AddOrder(Expression<Func<TEntity, object>> orderBy,
            bool isDescending = false)
        {
            _complexQuery.OrderByExpressions
                .Enqueue(new OrderByConfig<TEntity>() { Expression = orderBy, IsDescending = isDescending });

            return this;
        }

        public ComplexQueryBuilder<TEntity> AddPagination(
            int pageIndex,
            int recordsQuantity,
            Expression<Func<TEntity, object>> orderBy = null,
            bool isDescending = false)
        {
            if (orderBy != null)
            {
                AddOrder(orderBy, isDescending);
            }

            _complexQuery.RecordsLimit = recordsQuantity;
            _complexQuery.RecordsOffset = (pageIndex - 1) * recordsQuantity;

            return this;
        }

        public ComplexQueryBuilder<TEntity> EnableTracking()
        {
            _complexQuery.TrackingEnabled = true;
            return this;
        }

        public ComplexQuery<TEntity> GetQuery()
        {
            return _complexQuery;
        }
    }
}
