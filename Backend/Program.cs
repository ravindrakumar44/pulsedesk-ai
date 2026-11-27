using System.Text;
using HelpdeskSentiment.Api.Data;
using HelpdeskSentiment.Api.Interfaces;
using HelpdeskSentiment.Api.Middleware;
using HelpdeskSentiment.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
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

string mysqlVersionString = builder.Configuration["Database:MySqlVersion"] ?? "8.0.36";
var mysqlVersion = new MySqlServerVersion(Version.Parse(mysqlVersionString));
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

// CORS for separate frontend hosting (plus single-origin support when served from wwwroot)
var originList = new List<string>();
string[]? configuredOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
if (configuredOrigins is { Length: > 0 })
{
    originList.AddRange(configuredOrigins);
}
string? originsCsv = builder.Configuration["Cors:AllowedOriginsCsv"];
if (!string.IsNullOrWhiteSpace(originsCsv))
{
    originList.AddRange(originsCsv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries));
}
if (originList.Count == 0)
{
    originList.AddRange(["http://localhost:5173", "http://127.0.0.1:5173"]);
}

builder.Services.AddCors(options =>
{
    options.AddPolicy("FrontendPolicy", policy =>
    {
        policy.WithOrigins(originList.Distinct(StringComparer.OrdinalIgnoreCase).ToArray())
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    options.KnownNetworks.Clear();
    options.KnownProxies.Clear();
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

app.UseForwardedHeaders();
app.UseMiddleware<ExceptionHandlingMiddleware>();

bool enableSwagger = app.Environment.IsDevelopment() || app.Configuration.GetValue<bool>("Swagger:Enabled", false);
if (enableSwagger)
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Serve built React SPA when Frontend/dist is published to wwwroot
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseCors("FrontendPolicy");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapGet("/api/health", () => Results.Ok(new { status = "Healthy", timestamp = DateTime.UtcNow }));

string webRoot = app.Environment.WebRootPath ?? Path.Combine(app.Environment.ContentRootPath, "wwwroot");
string spaIndexPath = Path.Combine(webRoot, "index.html");
if (File.Exists(spaIndexPath))
{
    app.MapFallback(async context =>
    {
        if (context.Request.Path.StartsWithSegments("/api") ||
            context.Request.Path.StartsWithSegments("/swagger"))
        {
            context.Response.StatusCode = StatusCodes.Status404NotFound;
            return;
        }

        context.Response.ContentType = "text/html; charset=utf-8";
        await context.Response.SendFileAsync(spaIndexPath);
    });
}

// Apply migrations and seed initial accounts
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
