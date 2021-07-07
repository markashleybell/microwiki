using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using MicroWiki.Abstract;
using MicroWiki.Concrete;
using MicroWiki.Support;

namespace MicroWiki
{
    public class Startup
    {
        public Startup(IConfiguration configuration) =>
            Configuration = configuration;

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            const string authenticationScheme = CookieAuthenticationDefaults.AuthenticationScheme;

            var connectionString = Configuration.GetValue<string>("ConnectionString");

            services.AddHttpContextAccessor();

            services.Configure<Settings>(Configuration);

            services.Configure<CookiePolicyOptions>(options => {
                options.CheckConsentNeeded = _ => false;
                options.MinimumSameSitePolicy = SameSiteMode.Strict;
                options.HttpOnly = HttpOnlyPolicy.Always;
                options.Secure = CookieSecurePolicy.Always;
            });

            services.AddRouting(options => options.LowercaseUrls = true);

            services.AddAuthentication(authenticationScheme)
                .AddCookie(authenticationScheme, options => {
                    options.LoginPath = "/users/login";
                    options.LogoutPath = "/users/logout";
                });

            services.AddScoped<IUserService, UserService>();
            services.AddScoped<IDateTimeService, DateTimeService>();
            services.AddScoped<ISearchService, SqlServerSearchService>();

            services.AddScoped<IRepository, SqlServerRepository>(sp => {
                var ctxAccessor = sp.GetRequiredService<IHttpContextAccessor>();
                var optionsMonitor = sp.GetRequiredService<IOptionsMonitor<Settings>>();
                var userName = ctxAccessor.HttpContext.User.Identity.Name;
                return new SqlServerRepository(optionsMonitor, userName);
            });

            services.AddScoped<IFileManager, LocalFileManager>();

            services.AddControllersWithViews();
        }

        public void Configure(IApplicationBuilder app, IHostEnvironment env)
        {
            app.UseDeveloperExceptionPage();

            if (!env.IsDevelopment())
            {
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();

            app.UseRouting();

            app.UseCookiePolicy();

            app.UseAuthentication();
            app.UseAuthorization();

            app.UseEndpoints(endpoints => {
                endpoints.MapControllerRoute(
                    name: "default",
                    pattern: "wiki/{action}/{id?}",
                    defaults: new { controller = "Wiki", action = "Read" }
                );

                endpoints.MapControllerRoute(
                    name: "search",
                    pattern: "search/{action}/{id?}",
                    defaults: new { controller = "Search", action = "Index" }
                );

                endpoints.MapControllerRoute(
                    name: "files",
                    pattern: "files/{action}/{id?}",
                    defaults: new { controller = "Files", action = "Index" }
                );

                endpoints.MapControllerRoute(
                    name: "tags",
                    pattern: "tags/{action}/{id?}",
                    defaults: new { controller = "Tags", action = "Index" }
                );

                endpoints.MapControllerRoute(
                    name: "users",
                    pattern: "users/{action}/{id?}",
                    defaults: new { controller = "Users", action = "Index" }
                );

                endpoints.MapControllerRoute(
                    name: "read",
                    pattern: "{*location}",
                    defaults: new { controller = "Wiki", action = "Read" }
                );
            });
        }
    }
}
