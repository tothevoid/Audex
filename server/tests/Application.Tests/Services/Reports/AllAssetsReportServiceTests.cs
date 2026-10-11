using System.IO;
using ClosedXML.Excel;
using Microsoft.Extensions.DependencyInjection;
using Audex.Application.DTO;
using Audex.Application.DTO.User;
using Audex.Application.Interfaces.Reports;
using Audex.Application.Interfaces.User;
using Audex.Infrastructure.Constants;

namespace Audex.Application.Tests.Services.Reports
{
    public class AllAssetsReportServiceTests : TestBase
    {
        public AllAssetsReportServiceTests(ServiceProviderFixture serviceProviderFixture) : base(serviceProviderFixture)
        {
        }

        [Fact]
        public async Task TestCreateReport_GeneratesExcelByteArray()
        {
            var report = await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IAllAssetsReportService>();
                return await service.CreateReportAsync();
            });

            Assert.NotNull(report);
            Assert.NotNull(report.Data);
            Assert.NotEmpty(report.Data);
            Assert.Equal("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", report.ContentType);
            Assert.EndsWith(".xlsx", report.FileName);
        }

        [Fact]
        public async Task TestCreateReport_LocalizedSheets_RussianAndEnglish()
        {
            await ExecuteScopeAsync(async sp =>
            {
                var service = sp.GetRequiredService<IAllAssetsReportService>();
                var userService = sp.GetRequiredService<IUserProfileService>();

                // 1. Russian
                await userService.UpdateAsync(new UserProfileDto
                {
                    Id = UserProfileConstants.UserProfileId,
                    LanguageCode = "ru-RU"
                });

                var ruReport = await service.CreateReportAsync();
                using (var stream = new MemoryStream(ruReport.Data))
                using (var workbook = new XLWorkbook(stream))
                {
                    Assert.True(workbook.Worksheets.Contains("Итоги"));
                    Assert.True(workbook.Worksheets.Contains("Инвестиции"));
                    Assert.True(workbook.Worksheets.Contains("Должники"));
                }

                // 2. English
                await userService.UpdateAsync(new UserProfileDto
                {
                    Id = UserProfileConstants.UserProfileId,
                    LanguageCode = "en-US"
                });

                var enReport = await service.CreateReportAsync();
                using (var stream = new MemoryStream(enReport.Data))
                using (var workbook = new XLWorkbook(stream))
                {
                    Assert.True(workbook.Worksheets.Contains("Totals"));
                    Assert.True(workbook.Worksheets.Contains("Investments"));
                    Assert.True(workbook.Worksheets.Contains("Debtors"));
                }
            });
        }
    }
}
