using System.ComponentModel.DataAnnotations;

namespace frv_api.Models
{
    public class AdminUser
    {
        public int Id { get; set; }
        public string Username { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public string? FullName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

}
