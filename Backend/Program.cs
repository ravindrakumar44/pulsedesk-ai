using System.Text;
using HelpdeskSentiment.Api.Data;
using HelpdeskSentiment.Api.Interfaces;
using HelpdeskSentiment.Api.Middleware;
using HelpdeskSentiment.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Optional .env file support for local development without hardcoding secrets
LoadDotEnvIfPresent(Path.Combine(builder.Environment.ContentRootPath, ".env"));
builder.Configuration.AddEnvironmentVariables();

// Database (MySQL via Pomelo EF Core)
string connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Database connection string 'DefaultConnection' is not configured.");

// Use explicit ServerVersion when configured so design-time tooling and startup don't require pre-probing
var mysqlVersion = new MySqlServerVersion(new Version(8, 0, 36));
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(connectionString, mysqlVersion, mySqlOptions =>
        mySqlOptions.EnableRetryOnFailure(maxRetryCount: 3, maxRetryDelay: TimeSpan.FromSeconds(5), errorNumbersToAdd: null)));

// Application Services (Dependency Injection)
builder.Services.AddSingleton<ISentimentAnalysisService, SentimentAnalysisService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IComplaintService, ComplaintService>();

// JWT Authentication
string jwtKey = builder.Configuration["Jwt:Key"]
    ?? throw new InvalidOperationException("JWT key 'Jwt:Key' is not configured.");
string jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "HelpdeskSentimentApi";
string jwtAudience = builder.Configuration["Jwt:Audience"] ?? "HelpdeskSentimentClient";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.FromMinutes(1)
    };
});

builder.Services.AddAuthorization();

// CORS for React Vite frontend
string[] allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:5173", "http://127.0.0.1:5173"];

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Helpdesk Customer Sentiment Analysis API",
        Version = "v1",
        Description = "ASP.NET Core Web API for voice/text helpdesk complaint submission and NLP sentiment analysis."
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT token in the format: Bearer {token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/api/health", () => Results.Ok(new { status = "Healthy", timestamp = DateTime.UtcNow }));

// Apply migrations and seed initial dev admin & sample complaints
try
{
    await DbInitializer.InitializeAsync(app.Services, app.Configuration, app.Environment, app.Logger);
}
catch (Exception ex)
{
    app.Logger.LogError(ex, "Database initialization/migration failed. Verify MySQL is running and connection credentials are valid.");
    if (!app.Environment.IsDevelopment())
    {
        throw;
    }
}

app.Run();

static void LoadDotEnvIfPresent(string envPath)
{
    if (!File.Exists(envPath)) return;

    foreach (var rawLine in File.ReadAllLines(envPath))
    {
        string line = rawLine.Trim();
        if (string.IsNullOrEmpty(line) || line.StartsWith('#')) continue;

        int eqIdx = line.IndexOf('=');
        if (eqIdx <= 0) continue;

        string key = line[..eqIdx].Trim();
        string val = line[(eqIdx + 1)..].Trim().Trim('"');
        if (string.IsNullOrEmpty(Environment.GetEnvironmentVariable(key)))
        {
            Environment.SetEnvironmentVariable(key, val);
        }
    }
}
