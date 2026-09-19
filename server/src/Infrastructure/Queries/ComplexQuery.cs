using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using Audex.Shared.Entities;

namespace Audex.Infrastructure.Queries
{
    public class ComplexQuery<TEntity>
        where TEntity: class
    {
        public List<Expression<Func<TEntity, bool>>> Filters { get; set; } = new();

        public Func<IQueryable<TEntity>, IQueryable<TEntity>> Joins { get; set; }

        public Queue<OrderByConfig<TEntity>> OrderByExpressions { get; set; } = new Queue<OrderByConfig<TEntity>>();

        public int RecordsLimit { get; set; } = -1;

        public int RecordsOffset { get; set; } = -1;

        public bool TrackingEnabled { get; set; } = false;
    }

    public class OrderByConfig<TEntity>
    {
        public bool IsDescending { get; set; }

        public Expression<Func<TEntity, object>> Expression { get; set; }
    }
}
