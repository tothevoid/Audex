#nullable enable
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Audex.Application.DTO.Common;
using Audex.Application.Interfaces.Localization;

namespace Audex.WebApi.Controllers.Common
{
    [Produces("application/json")]
    [Route("[controller]")]
    [ApiController]
    [Authorize]
    public class LanguageController : ControllerBase
    {
        private readonly ITranslationProvider _translationProvider;

        public LanguageController(ITranslationProvider translationProvider)
        {
            _translationProvider = translationProvider;
        }

        [HttpGet]
        public ActionResult<IReadOnlyList<LanguageDto>> GetLanguages()
        {
            var languages = _translationProvider.GetSupportedLanguages();
            return Ok(languages);
        }
    }
}
