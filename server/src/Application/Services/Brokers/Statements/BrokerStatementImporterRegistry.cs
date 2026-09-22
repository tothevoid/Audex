#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using Audex.Application.DTO.Brokers.Statements;
using Audex.Application.Interfaces.Brokers.Statements;

namespace Audex.Application.Services.Brokers.Statements
{
    public class BrokerStatementImporterRegistry : IBrokerStatementImporterRegistry
    {
        private readonly Dictionary<string, IBrokerStatementImporter> _importers;

        public BrokerStatementImporterRegistry(IEnumerable<IBrokerStatementImporter>? importers = null)
        {
            _importers = new Dictionary<string, IBrokerStatementImporter>(StringComparer.OrdinalIgnoreCase);

            if (importers != null)
            {
                foreach (var importer in importers)
                {
                    _importers[importer.Id] = importer;
                }
            }

            if (_importers.Count == 0)
            {
                ScanAndRegisterImporters();
            }
        }

        public IReadOnlyList<BrokerStatementImporterDto> GetAll()
        {
            return _importers.Values
                .Select(importer => new BrokerStatementImporterDto
                {
                    Id = importer.Id,
                    Name = importer.Name,
                    SupportedExtensions = importer.SupportedExtensions
                })
                .ToList();
        }

        public IBrokerStatementImporter GetById(string id)
        {
            if (TryGetById(id, out var importer) && importer != null)
            {
                return importer;
            }

            throw new KeyNotFoundException($"Broker statement importer with id '{id}' was not found.");
        }

        public bool TryGetById(string id, out IBrokerStatementImporter? importer)
        {
            if (string.IsNullOrWhiteSpace(id))
            {
                importer = null;
                return false;
            }

            return _importers.TryGetValue(id, out importer);
        }

        private void ScanAndRegisterImporters()
        {
            var interfaceType = typeof(IBrokerStatementImporter);
            var assembly = interfaceType.Assembly;

            var importerTypes = assembly.GetTypes()
                .Where(type => type.IsClass && !type.IsAbstract && interfaceType.IsAssignableFrom(type));

            foreach (var importerType in importerTypes)
            {
                try
                {
                    if (Activator.CreateInstance(importerType) is not IBrokerStatementImporter instance)
                    {
                        throw new InvalidOperationException($"Type '{importerType.FullName}' implements '{interfaceType.Name}' but could not be instantiated.");
                    }

                    _importers[instance.Id] = instance;
                }
                catch (Exception exception) when (exception is not InvalidOperationException)
                {
                    throw new InvalidOperationException(
                        $"Failed to create an instance of broker statement importer '{importerType.FullName}'. Ensure it has a public parameterless constructor.",
                        exception);
                }
            }
        }
    }
}
