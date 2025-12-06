namespace frv_api.Models
{
    public class Reservation
    {
        public int Id { get; set; }
        public string Nombre { get; set; } = null!;
        public string Telefono { get; set; } = null!;
        public string Provincia { get; set; } = null!;
        public string? Direccion { get; set; }
        public DateTime Fecha { get; set; }        // date portion used
        public TimeSpan Hora { get; set; }         // time only
        public decimal Costo { get; set; }
        public string Estado { get; set; } = "PENDIENTE";
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }

}
