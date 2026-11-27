# Deploying PulseDesk AI to MonsterASP.NET

This guide covers deploying **PulseDesk AI** (React + ASP.NET Core 8 + MySQL) to **MonsterASP.NET** as a single unified web application (recommended, zero CORS issues, HTTPS ready for Web Speech API).

---

## Step 1: Create a MySQL Database in MonsterASP.NET

1. Log in to your **MonsterASP.NET Control Panel**.
2. Go to **Databases** → **MySQL** → **Create Database**.
3. Note down:
   - **Host / Server** (e.g., `mysqlXXXX.site4now.net` or the host shown in your panel)
   - **Database Name**
   - **Username**
   - **Password**

---

## Step 2: Create Production Configuration (`Backend/appsettings.Production.json`)

1. Copy `Backend/appsettings.Production.example.json` to `Backend/appsettings.Production.json` (gitignored so your secrets stay off GitHub):
   ```powershell
   Copy-Item Backend\appsettings.Production.example.json Backend\appsettings.Production.json
   ```
2. Edit `Backend/appsettings.Production.json` with your MonsterASP.NET details:
   - **`ConnectionStrings.DefaultConnection`**: Enter your MonsterASP.NET MySQL `Server`, `Database`, `User`, and `Password`.
   - **`Jwt.Key`**: Replace with a strong random string (at least 32 characters).
   - **`Cors.AllowedOrigins`**: Set your MonsterASP.NET site URL (e.g., `https://your-site.runasp.net`).
   - **`AdminSeed` / `AgentSeed` / `SeedData`**: Set initial admin/agent passwords. Set `SeedData.EnableSampleData` to `false` once you no longer want demo complaints seeded.

---

## Step 3: Build & Package for MonsterASP.NET

Run the automated publish script from the project root:

```powershell
.\publish-monster.ps1
```

This script:
1. Builds `Frontend/` (`npm run build`).
2. Copies `Frontend/dist/` into `Backend/wwwroot/` so ASP.NET Core serves both the React UI and `/api/*` endpoints from the same domain.
3. Runs all 18 backend tests.
4. Publishes the Release build into `./publish/` and creates `PulseDesk-MonsterASP-Deploy.zip` (with `web.config` for IIS `AspNetCoreModuleV2`, without local `.env` or `appsettings.Development.json`).

---

## Step 4: Upload to MonsterASP.NET

1. Open your site in **MonsterASP.NET Control Panel** → **Websites** → **File Manager** (or connect via FTP/FTPS).
2. Navigate to your site root (`wwwroot`).
3. Upload **`PulseDesk-MonsterASP-Deploy.zip`** and click **Extract** (or upload all files inside `./publish/`).
4. Ensure `appsettings.Production.json` is present in the uploaded site root with your MonsterASP.NET MySQL credentials.
   *(If you created `Backend/appsettings.Production.json` before running `.\publish-monster.ps1`, `dotnet publish` includes it automatically.)*
5. Ensure the site is set to **.NET 8.0** (In-Process / Out-of-Process) in MonsterASP.NET Website Settings, and **Start / Restart** the website.

---

## Step 5: Verify Live Deployment

1. Visit `https://your-site.runasp.net/api/health` — should return `{"status":"Healthy", ...}`.
2. On first startup, `DbInitializer` automatically runs EF Core migrations (`InitialCreate` and `AddAgentAssignmentAndResolution`) against your MonsterASP.NET MySQL database and seeds your initial Admin/Agent accounts.
3. Visit `https://your-site.runasp.net` in **Google Chrome** or **Microsoft Edge** (HTTPS enables browser microphone access for the **Web Speech API**!).
4. If you enabled Swagger (`"Swagger": { "Enabled": true }`), API docs are at `https://your-site.runasp.net/swagger`.

---

## Troubleshooting

- **500.30 Startup Error on IIS**: Check `logs/` or enable `stdoutLogEnabled="true"` in `web.config` inside MonsterASP.NET File Manager. Almost always caused by an incorrect MySQL `ConnectionStrings:DefaultConnection` or missing `Jwt:Key`.
- **MySQL Version Mismatch**: If MonsterASP.NET provides a different MySQL version, update `"Database": { "MySqlVersion": "8.0.36" }` in `appsettings.Production.json`.
- **Voice Input Not Working**: Make sure you access the site over **`https://`** (browsers block microphone access on plain `http://` external domains) using Chrome or Edge.
