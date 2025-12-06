using frv_api.Data;
using frv_api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace frv_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReservationsController : ControllerBase
    {
        private readonly AppDbContext _db;
        public ReservationsController(AppDbContext db) { _db = db; }

        // GET api/reservations?date=2025-12-10
        [HttpGet]
        public async Task<IActionResult> Get([FromQuery] DateTime? date)
        {
            if (date.HasValue)
            {
                var list = await _db.Reservations.Where(r => r.Fecha == date.Value.Date).OrderBy(r => r.Hora).ToListAsync();
                return Ok(list);
            }
            var all = await _db.Reservations.OrderByDescending(r => r.CreatedAt).ToListAsync();
            return Ok(all);
        }

        // GET api/reservations/availability?date=yyyy-MM-dd
        [HttpGet("availability")]
        public async Task<IActionResult> Availability([FromQuery] DateTime date)
        {
            var baseCapacity = int.Parse((await _db.Settings.FindAsync("BaseCapacity")).Value);
            var booked = await _db.Reservations.CountAsync(r => r.Fecha == date.Date && (r.Estado == "PENDIENTE" || r.Estado == "EN_PROCESO"));
            var extra = await _db.ExtraSlots.CountAsync(es => es.ForDate == date.Date);
            return Ok(new { date = date.Date, capacity = baseCapacity + extra, booked, available = Math.Max(0, baseCapacity + extra - booked) });
        }

        // POST api/reservations
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Reservation dto)
        {
            // Validate DTO (minimal)
            if (dto == null) return BadRequest("Invalid data");
            dto.Fecha = dto.Fecha.Date;

            var baseCapacity = int.Parse((await _db.Settings.FindAsync("BaseCapacity")).Value);
            var booked = await _db.Reservations.CountAsync(r => r.Fecha == dto.Fecha && (r.Estado == "PENDIENTE" || r.Estado == "EN_PROCESO"));
            var extra = await _db.ExtraSlots.CountAsync(es => es.ForDate == dto.Fecha);

            if (booked >= baseCapacity + extra) return BadRequest(new { error = "No hay cupos disponibles para esa fecha" });

            var pr = await _db.ProvinceRates.FindAsync(dto.Provincia);
            var extraCost = pr != null ? pr.ExtraCost : 0m;
            dto.Costo = decimal.Parse((await _db.Settings.FindAsync("BasePrice")).Value) + extraCost;
            dto.Estado = "PENDIENTE";
            dto.CreatedAt = DateTime.UtcNow;

            _db.Reservations.Add(dto);
            await _db.SaveChangesAsync();
            return Ok(dto);
        }

        // PUT api/reservations/{id}/status
        [HttpPut("{id}/status")]
        [Authorize] // admin only
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateStatusModel m)
        {
            var r = await _db.Reservations.FindAsync(id);
            if (r == null) return NotFound();

            var previous = r.Estado;
            r.Estado = m.Status.ToUpper();
            await _db.SaveChangesAsync();

            // Rule: if marking COMPLETADA and both reservation time and current time < 15:00 local
            if (r.Estado == "COMPLETADA")
            {
                var nowLocal = DateTime.Now;
                if (r.Fecha.Date == nowLocal.Date && nowLocal.TimeOfDay < new TimeSpan(15, 0, 0) && r.Hora < new TimeSpan(15, 0, 0))
                {
                    _db.ExtraSlots.Add(new ExtraSlot { ForDate = r.Fecha.Date, CreatedAt = DateTime.UtcNow });
                    await _db.SaveChangesAsync();
                }
            }

            return Ok(r);
        }
    }

    public class UpdateStatusModel { public string Status { get; set; } = null!; }

}
