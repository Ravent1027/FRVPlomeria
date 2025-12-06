namespace frv_api.Models
{
    public class ExtraSlot
    {
        public int Id { get; set; }
        public DateTime ForDate { get; set; }   // Use Date component
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }


}
