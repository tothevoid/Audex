using System.Linq.Expressions;
using Audex.Infrastructure.Entities.Accounts;
using Audex.Infrastructure.Queries;
using Xunit;

namespace Audex.Infrastructure.Tests.Queries
{
    public class ComplexQueryBuilderTests
    {
        [Fact]
        public void Build_DefaultQuery_HasDefaultValues()
        {
            var builder = new ComplexQueryBuilder<AccountType>();

            var query = builder.GetQuery();

            Assert.NotNull(query);
            Assert.Empty(query.Filters);
            Assert.Null(query.Joins);
            Assert.Empty(query.OrderByExpressions);
            Assert.Equal(-1, query.RecordsLimit);
            Assert.Equal(-1, query.RecordsOffset);
            Assert.False(query.TrackingEnabled);
        }

        [Fact]
        public void AddFilter_SetsFilterExpression()
        {
            var builder = new ComplexQueryBuilder<AccountType>();
            Expression<Func<AccountType, bool>> filter = x => x.Active;

            builder.AddFilter(filter);
            var query = builder.GetQuery();

            Assert.Single(query.Filters);
            Assert.Equal(filter, query.Filters[0]);
        }

        [Fact]
        public void AddFilter_MultipleFilters_AccumulatesInFiltersList()
        {
            var builder = new ComplexQueryBuilder<AccountType>();
            Expression<Func<AccountType, bool>> filter1 = x => x.Active;
            Expression<Func<AccountType, bool>> filter2 = x => x.Name != null;

            builder.AddFilter(filter1).AddFilter(filter2);
            var query = builder.GetQuery();

            Assert.Equal(2, query.Filters.Count);
            Assert.Equal(filter1, query.Filters[0]);
            Assert.Equal(filter2, query.Filters[1]);
        }

        [Fact]
        public void AddOrder_EnqueuesOrderByExpressions()
        {
            var builder = new ComplexQueryBuilder<AccountType>();

            builder.AddOrder(x => x.Name, isDescending: false);
            builder.AddOrder(x => x.Id, isDescending: true);

            var query = builder.GetQuery();

            Assert.Equal(2, query.OrderByExpressions.Count);
            var firstOrder = query.OrderByExpressions.Dequeue();
            Assert.False(firstOrder.IsDescending);

            var secondOrder = query.OrderByExpressions.Dequeue();
            Assert.True(secondOrder.IsDescending);
        }

        [Fact]
        public void AddPagination_CalculatesLimitAndOffset()
        {
            var builder = new ComplexQueryBuilder<AccountType>();

            builder.AddPagination(pageIndex: 3, recordsQuantity: 10, orderBy: x => x.Name, isDescending: true);

            var query = builder.GetQuery();

            Assert.Equal(10, query.RecordsLimit);
            Assert.Equal(20, query.RecordsOffset); // (3 - 1) * 10 = 20
            Assert.Single(query.OrderByExpressions);
            var order = query.OrderByExpressions.Peek();
            Assert.True(order.IsDescending);
        }

        [Fact]
        public void EnableTracking_SetsTrackingEnabledToTrue()
        {
            var builder = new ComplexQueryBuilder<AccountType>();

            builder.EnableTracking();

            var query = builder.GetQuery();

            Assert.True(query.TrackingEnabled);
        }
    }
}
