using System;
using System.IO;
using System.Text.Encodings.Web;
using System.Text.Json;
using Serilog.Events;
using Serilog.Formatting;
using Serilog.Formatting.Compact;

namespace Audex.WebApi.Formatters
{
    public sealed class PrettyJsonFormatter : ITextFormatter
    {
        private static readonly CompactJsonFormatter CompactFormatter = new();
        private static readonly JsonSerializerOptions JsonSerializationOptions = new()
        {
            WriteIndented = true,
            Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping
        };

        public void Format(LogEvent logEvent, TextWriter output)
        {
            ArgumentNullException.ThrowIfNull(logEvent);
            ArgumentNullException.ThrowIfNull(output);

            using var stringWriter = new StringWriter();
            CompactFormatter.Format(logEvent, stringWriter);
            var compactJson = stringWriter.ToString();

            try
            {
                using var jsonDocument = JsonDocument.Parse(compactJson);
                var prettyJson = JsonSerializer.Serialize(jsonDocument.RootElement, JsonSerializationOptions);
                output.WriteLine(prettyJson);
            }
            catch
            {
                output.WriteLine(compactJson);
            }
        }
    }
}
