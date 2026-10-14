namespace ProjetoIntegrador.Models
{
    public class LoginModel
    {
        public string Email { get; set; } = string.Empty;
        public string Senha { get; set; } = string.Empty;
        public bool LembrarMe { get; set; }
    }
}
