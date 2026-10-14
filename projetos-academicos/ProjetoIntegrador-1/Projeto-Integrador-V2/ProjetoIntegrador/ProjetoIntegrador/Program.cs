using Microsoft.AspNetCore.Components.Authorization;
using Microsoft.AspNetCore.Components.Server;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProjetoIntegrador.Components;
using ProjetoIntegrador.Components.Pages;
using ProjetoIntegrador.Data;
using ProjetoIntegrador.Models;

var builder = WebApplication.CreateBuilder(args);

// Blazor Server + erros detalhados para debug
builder.Services.AddServerSideBlazor()
    .AddCircuitOptions(options => { options.DetailedErrors = true; });

builder.Services.AddControllersWithViews();

// Banco de dados
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection") +
                         ";Encrypt=True;TrustServerCertificate=True;"));

// Identity com configuração de senha
builder.Services.AddIdentity<Usuario, IdentityRole>(options =>
{
    options.SignIn.RequireConfirmedEmail = false;
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
})
.AddEntityFrameworkStores<ApplicationDbContext>()
.AddDefaultTokenProviders();

// Políticas por roles
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("Administrador", policy => policy.RequireRole("Administrador"));
    options.AddPolicy("Medico", policy => policy.RequireRole("Medico"));
    options.AddPolicy("Recepcionista", policy => policy.RequireRole("Recepcionista"));
    options.AddPolicy("Paciente", policy => policy.RequireRole("Paciente"));
});

// Razor Components com renderização interativa (Blazor Server)
builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

// Autenticação e Autorização
builder.Services.AddAuthentication();
builder.Services.AddAuthorization();
builder.Services.AddCascadingAuthenticationState();
builder.Services.AddHttpContextAccessor();
builder.Services.AddHttpClient();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.AccessDeniedPath = "/acesso-negado";
});

var app = builder.Build();

// Pipeline HTTP
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

// ✅ Antiforgery obrigatório com o novo modelo de renderização interativa do .NET 8
app.UseAntiforgery();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.MapControllers();

// Criação das Roles na inicialização
using (var scope = app.Services.CreateScope())
{
    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();

    string[] roles = ["Administrador", "Medico", "Recepcionista", "Paciente"];

    foreach (var role in roles)
    {
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole(role));
    }
}

app.Run();
