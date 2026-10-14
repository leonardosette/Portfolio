using System.ComponentModel.DataAnnotations.Schema;

namespace ProjetoIntegrador.Models
{
    public class Anamnese
    {
        public string Id { get; set; }

        [ForeignKey("Agendamento")]
        public string IdAgendamento { get; set; }

        public Agendamento? Agendamento { get; set; }

        public string? QueixaPrincipal { get; set; }
        public string? HistoriaDoencaAtual { get; set; }
        public string? HistoricoMedico { get; set; }
        public string? AlergiasEMedicamentos { get; set; }
        public DateTime DataCriacao { get; set; }
    }
}
