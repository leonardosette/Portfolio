using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjetoIntegrador.Models
{
    // Extende IdentityUser para utilizar recursos prontos do ASP.NET Identity
    public class Usuario : IdentityUser
    {
        [Required]
        [StringLength(100)]
        public string Nome { get; set; }

        [Required]
        [StringLength(14)]
        public string CPF { get; set; }

        [Required]
        [StringLength(200)]
        public string Endereco { get; set; }

        [StringLength(100)]
        public string? Especialidade { get; set; } // Apenas para médicos

        [StringLength(20)]
        public string? CRM { get; set; } // Apenas para médicos

        [ForeignKey("Perfil")]
        public string IdPerfil { get; set; }

        // Relacionamento com a entidade Perfil
        public Perfil Perfil { get; set; }
    }
}
