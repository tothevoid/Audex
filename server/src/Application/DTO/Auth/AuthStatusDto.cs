namespace Audex.Application.DTO.Auth
{
    public class AuthStatusDto
    {
        public bool IsSetupRequired { get; set; }

        public string UserName { get; set; } = string.Empty;
    }
}
