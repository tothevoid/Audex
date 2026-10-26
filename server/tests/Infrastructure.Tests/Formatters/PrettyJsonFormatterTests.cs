using System;
using System.IO;
using System.Text.Json;
using Audex.WebApi.Formatters;
using Serilog.Events;
using Serilog.Parsing;
using Xunit;

namespace Audex.Infrastructure.Tests.Formatters
{
    public class PrettyJsonFormatterTests
    {
        [Fact]
        public void Format_ValidLogEvent_OutputsIndentedJson()
        {
            // Arrange
            var formatter = new PrettyJsonFormatter();
            var messageTemplate = new MessageTemplateParser().Parse("Processing job {JobName} failed");
            var properties = new[]
            {
                new LogEventProperty("JobName", new ScalarValue("PullCryptoPrices")),
                new LogEventProperty("RetryCount", new ScalarValue(0))
            };
            var logEvent = new LogEvent(
                timestamp: DateTimeOffset.UtcNow,
                level: LogEventLevel.Error,
                exception: new InvalidOperationException("Test error"),
                messageTemplate: messageTemplate,
                properties: properties);

            using var stringWriter = new StringWriter();

            // Act
            formatter.Format(logEvent, stringWriter);
            var formattedOutput = stringWriter.ToString();

            // Assert
            Assert.NotEmpty(formattedOutput);
            Assert.Contains(Environment.NewLine, formattedOutput);

            using var jsonDocument = JsonDocument.Parse(formattedOutput);
            var rootElement = jsonDocument.RootElement;

            Assert.Equal("Error", rootElement.GetProperty("@l").GetString());
            Assert.Equal("PullCryptoPrices", rootElement.GetProperty("JobName").GetString());
            Assert.Equal(0, rootElement.GetProperty("RetryCount").GetInt32());
        }

        [Fact]
        public void Format_LogEventWithCyrillic_PreservesUnescapedCyrillic()
        {
            // Arrange
            var formatter = new PrettyJsonFormatter();
            const string cyrillicMessage = "Ни для одной из зарегистрированных криптовалют не удалось получить цену";
            var messageTemplate = new MessageTemplateParser().Parse("{ErrorMessage}");
            var properties = new[]
            {
                new LogEventProperty("ErrorMessage", new ScalarValue(cyrillicMessage))
            };
            var logEvent = new LogEvent(
                timestamp: DateTimeOffset.UtcNow,
                level: LogEventLevel.Error,
                exception: null,
                messageTemplate: messageTemplate,
                properties: properties);

            using var stringWriter = new StringWriter();

            // Act
            formatter.Format(logEvent, stringWriter);
            var formattedOutput = stringWriter.ToString();

            // Assert
            Assert.Contains(cyrillicMessage, formattedOutput);
            Assert.DoesNotContain("\\u04", formattedOutput);
        }

        [Fact]
        public void Format_NullArguments_ThrowsArgumentNullException()
        {
            // Arrange
            var formatter = new PrettyJsonFormatter();
            var dummyLogEvent = new LogEvent(
                DateTimeOffset.UtcNow,
                LogEventLevel.Information,
                null,
                new MessageTemplateParser().Parse("Test"),
                []);

            using var stringWriter = new StringWriter();

            // Act & Assert
            Assert.Throws<ArgumentNullException>(() => formatter.Format(null!, stringWriter));
            Assert.Throws<ArgumentNullException>(() => formatter.Format(dummyLogEvent, null!));
        }
    }
}
