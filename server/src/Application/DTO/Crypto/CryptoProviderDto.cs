using Audex.Infrastructure.Entities.Securities;
using Audex.Shared.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Audex.Application.DTO.Crypto
{
    public class CryptoProviderDto: BaseEntity
    {
        public string Name { get; set; }

        public bool Active { get; set; } = true;

        public string IconKey { get; set; }
    }
}
