namespace frv_api.Data
{
    using frv_api.Models;
    using Microsoft.EntityFrameworkCore;
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> opts) : base(opts) { }

        public DbSet<Reservation> Reservations { get; set; } = null!;
        public DbSet<ProvinceRate> ProvinceRates { get; set; } = null!;
        public DbSet<Setting> Settings { get; set; } = null!;
        public DbSet<ExtraSlot> ExtraSlots { get; set; } = null!;
        public DbSet<AdminUser> AdminUsers { get; set; } = null!;
    }

}
