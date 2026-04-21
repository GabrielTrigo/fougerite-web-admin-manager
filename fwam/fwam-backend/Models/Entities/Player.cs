using System.ComponentModel.DataAnnotations;

namespace Fwam.Backend.Models.Entities
{
    public class Player
    {
        [Key]
        [MaxLength(50)]
        public string SteamId { get; set; } = string.Empty;

        [Required]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public bool IsOnline { get; set; }

        public DateTime LastConnection { get; set; } = DateTime.UtcNow;

        [MaxLength(255)]
        public string? AvatarUrl { get; set; }

        [MaxLength(50)]
        public string? IpAddress { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
