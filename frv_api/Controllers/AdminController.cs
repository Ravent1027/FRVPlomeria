using frv_api.Data;
using frv_api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;


namespace frv_api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _db;
        private readonly IConfiguration _cfg;
        public AdminController(AppDbContext db, IConfiguration cfg) { _db = db; _cfg = cfg; }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginModel m)
        {
            var user = await _db.AdminUsers.SingleOrDefaultAsync(u => u.Username == m.Username);
            if (user == null) return Unauthorized();

            if (!BCrypt.Net.BCrypt.Verify(m.Password, user.PasswordHash)) return Unauthorized();

            // create JWT
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_cfg["Jwt:Key"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claims = new[] {
            new Claim(ClaimTypes.Name, user.Username),
            new Claim("uid", user.Id.ToString())
        };
            var token = new JwtSecurityToken(_cfg["Jwt:Issuer"], _cfg["Jwt:Audience"], claims, expires: DateTime.UtcNow.AddHours(8), signingCredentials: creds);
            return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token) });
        }

        // Endpoint to create admin user (only for initial setup; secure/remove later)
        [HttpPost("create")]
        public async Task<IActionResult> CreateAdmin([FromBody] LoginModel m)
        {
            if (await _db.AdminUsers.AnyAsync(x => x.Username == m.Username)) return BadRequest("Exists");
            var hash = BCrypt.Net.BCrypt.HashPassword(m.Password);
            _db.AdminUsers.Add(new AdminUser { Username = m.Username, PasswordHash = hash, FullName = m.Username });
            await _db.SaveChangesAsync();
            return Ok();
        }
    }

    public class LoginModel { public string Username { get; set; } = null!; public string Password { get; set; } = null!; }

}
