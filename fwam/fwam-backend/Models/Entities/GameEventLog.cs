using System.ComponentModel.DataAnnotations;

namespace Fwam.Backend.Models.Entities
{
    public class GameEventLog
    {
        [Key]
        public Guid Id { get; set; }

        [Required]
        [MaxLength(50)]
        public string Type { get; set; } = string.Empty;

        [MaxLength(100)]
        public string? PlayerName { get; set; }

        [MaxLength(50)]
        public string? PlayerUID { get; set; }

        public string? Message { get; set; }

        public DateTime Timestamp { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// O JSON bruto vindo da ponte, para auditoria profunda se necessário.
        /// </summary>
        public string? RawData { get; set; }
    }
}
