namespace Audex.WebApi.Models.Common
{
    public class ClientOptions
    {
        private string _url = string.Empty;

        public string Url
        {
            get => _url.TrimEnd('/');
            set => _url = value ?? string.Empty;
        }
    }
}

