using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjetoIntegrador.Models
{
    [Table("Consultas")]
    public class Consulta
    {
        [Key]
        public string Id { get; set; } // Chave primária única

        [ForeignKey("Agendamento")]
        public string IdAgendamento { get; set; }

        // Propriedades FK explícitas (Id do Paciente e Médico)
        [ForeignKey("Paciente")]
        public string IdPaciente { get; set; }

        [ForeignKey("Medico")]
        public string IdMedico { get; set; }

        public DateTime DataConsulta { get; set; }
        public string StatusConsulta { get; set; }
        public string Diagnostico { get; set; }
        public string Prescricao { get; set; }
        public DateTime DataCriacao { get; set; }
        public string Observacoes { get; set; }

        // Propriedades de navegação
        public Usuario Paciente { get; set; }
        public Usuario Medico { get; set; }
        public Agendamento Agendamento { get; set; }
    }
}
