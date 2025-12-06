using System.ComponentModel.DataAnnotations;

namespace frv_api.Models
{
    public class Setting
    {
        [Key]
        public string Key { get; set; } = null!;
        public string Value { get; set; } = null!;
    }

}
