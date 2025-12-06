using System.ComponentModel.DataAnnotations;

namespace frv_api.Models
{
    public class ProvinceRate
    {
        [Key]
        public string Provincia { get; set; } = null!;
        public decimal ExtraCost { get; set; }
    }

}
