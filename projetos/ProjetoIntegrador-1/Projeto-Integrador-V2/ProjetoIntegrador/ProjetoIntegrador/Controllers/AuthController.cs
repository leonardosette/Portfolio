using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using ProjetoIntegrador.Models;
using System.Security.Claims;

namespace ProjetoIntegrador.Controllers
{
    [Route("auth")]
    public class AuthController : Controller
    {
        private readonly SignInManager<Usuario> _signInManager;
        private readonly UserManager<Usuario> _userManager;

        public AuthController(SignInManager<Usuario> signInManager, UserManager<Usuario> userManager)
        {
            _signInManager = signInManager;
            _userManager = userManager;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromForm] string email, [FromForm] string password)
        {
            var user = await _userManager.FindByEmailAsync(email);
            if (user == null)
                return Redirect("/login?error=1");

            var result = await _signInManager.CheckPasswordSignInAsync(user, password, lockoutOnFailure: false);

            if (result.Succeeded)
            {
                var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Name, user.Nome),
            new Claim("Nome", user.Nome)
        };

                // Recupera as roles
                var roles = await _userManager.GetRolesAsync(user);
                foreach (var role in roles)
                {
                    claims.Add(new Claim(ClaimTypes.Role, role));
                }

                var identity = new ClaimsIdentity(claims, IdentityConstants.ApplicationScheme);
                var principal = new ClaimsPrincipal(identity);

                await HttpContext.SignInAsync(IdentityConstants.ApplicationScheme, principal);

                // Redirecionamento por role
                if (roles.Contains("Medico"))
                    return Redirect("/dash-medico");
                else if (roles.Contains("Administrador"))
                    return Redirect("/dash-admin"); // crie esse depois
                else if (roles.Contains("Recepcionista"))
                    return Redirect("/dash-recepcionista"); // crie esse depois
                else if (roles.Contains("Paciente"))
                    return Redirect("/dash-paciente"); // crie esse depois

                // fallback
                return Redirect("/login?error=sem-role");
            }

            return Redirect("/login?error=1");
        }




        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            await _signInManager.SignOutAsync();
            return Redirect("/login");
        }
    }
}
