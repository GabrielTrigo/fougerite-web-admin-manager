using Fwam.Backend.Data;
using Fwam.Backend.Services;
using Fwam.Backend.Workers;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// FWAM Infrastructure
builder.Services.AddSingleton<IRedisService, RedisService>();
builder.Services.AddHostedService<TelemetriaWorker>();
builder.Services.AddHostedService<SyncWorker>();

// FWAM Persistence
builder.Services.AddDbContext<FwamDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configuração de CORS para o Dashboard Angular
builder.Services.AddCors(options =>
{
    options.AddPolicy("FwamPolicy", policy =>
    {
        policy.WithOrigins("http://localhost:4200") // URL padrão do Angular
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Obrigatório para SignalR
    });
});

builder.Services.AddSignalR();

var app = builder.Build();

// Ensure DB is created on startup
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<FwamDbContext>();
    dbContext.Database.EnsureCreated();
}

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("FwamPolicy");

app.UseAuthorization();

app.MapControllers();
app.MapHub<Fwam.Backend.Hubs.EventsHub>("/hubs/events");

app.Run();
