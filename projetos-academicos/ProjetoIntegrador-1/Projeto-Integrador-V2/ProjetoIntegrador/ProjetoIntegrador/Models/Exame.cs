using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ProjetoIntegrador.Models
{
    [Table("Exames")]
    public class Exame
    {
        [Key]
        public string Id { get; set; } // Chave primária

        [ForeignKey("Consulta")]
        public string IdConsulta { get; set; } // Relacionamento com a consulta

        public string TipoExame { get; set; } // Tipo do exame (Solicitado ou Levado)

        public string Descricao { get; set; } // Descrição do exame solicitado ou levado

        public DateTime DataSolicitacao { get; set; } // Data em que o médico solicitou o exame

        public DateTime DataRealizacao { get; set; } // Data em que o exame foi realizado (independente de quem trouxe)

        public string Resultado { get; set; } // Resultado do exame (após realizado)

        public string ArquivoExame { get; set; } // Arquivo do exame, se necessário

        public string Observacoes { get; set; } // Observações adicionais sobre o exame

        public string StatusExame { get; set; } // Status do exame (Solicitado, Realizado, Aguardando Resultado)

        // Propriedade de navegação
        public Consulta Consulta { get; set; } // Relacionamento com a consulta
    }
}
