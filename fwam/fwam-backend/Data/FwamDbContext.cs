using Fwam.Backend.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace Fwam.Backend.Data
{
    public class FwamDbContext : DbContext
    {
        public FwamDbContext(DbContextOptions<FwamDbContext> options) : base(options)
        {
        }

        public DbSet<GameEventLog> EventLogs { get; set; }
        public DbSet<Player> Players { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Índices para performance em queries de analytics
            modelBuilder.Entity<GameEventLog>()
                .HasIndex(e => e.Timestamp);

            modelBuilder.Entity<GameEventLog>()
                .HasIndex(e => e.Type);

            // Índices para performance na listagem de jogadores
            modelBuilder.Entity<Player>()
                .HasIndex(p => p.IsOnline);

            modelBuilder.Entity<Player>()
                .HasIndex(p => p.Name);
        }
    }
}
