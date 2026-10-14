using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjetoIntegrador.Models
{
    [Table("Relatorios")]
    public class Relatorio
    {
        [Key]
        public string Id { get; set; }

        [ForeignKey("Medico")]
        public string IdMedico { get; set; }

        [ForeignKey("Paciente")]
        public string IdPaciente { get; set; }

        [ForeignKey("Agendamento")]
        public string IdAgendamento { get; set; } // Relacionamento com Agendamento

        public string? Diagnostico { get; set; }

        public string? Prescricao { get; set; }

        public string? Observacoes { get; set; }

        public DateTime DataGeracao { get; set; }

        // Navegações
        public Usuario Medico { get; set; }
        public Usuario Paciente { get; set; }
        public Agendamento Agendamento { get; set; }
    }
}
