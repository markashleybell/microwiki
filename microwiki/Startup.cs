using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.CookiePolicy;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
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
            var connectionString = Configuration.GetValue<string>("ConnectionString");
            var authenticationScheme = CookieAuthenticationDefaults.AuthenticationScheme;

            services.AddHttpContextAccessor();

            services.Configure<Settings>(Configuration);

            services.Configure<CookiePolicyOptions>(options => {
                options.CheckConsentNeeded = context => false;
                options.MinimumSameSitePolicy = SameSiteMode.Strict;
                options.HttpOnly = HttpOnlyPolicy.Always;
                options.Secure = CookieSecurePolicy.Always;
            });

            services.AddAuthentication(authenticationScheme)
                .AddCookie(authenticationScheme, options => {
                    options.LoginPath = "/users/login";
                    options.LogoutPath = "/users/logout";

                    // options.AccessDeniedPath = "????";
                });

            services.AddScoped<IRepository, SqlServerRepository>(sp => {
                var ctxAccessor = sp.GetRequiredService<IHttpContextAccessor>();
                var optionsMonitor = sp.GetRequiredService<IOptionsMonitor<Settings>>();

                // TODO: Tidy this up!!
                var userName = "markb"; // ctxAccessor.HttpContext.User.Identity.Name;
                return new SqlServerRepository(optionsMonitor, userName);
            });

            services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_2);
        }

        public void Configure(IApplicationBuilder app, IHostingEnvironment env)
        {
            app.UseDeveloperExceptionPage();

            if (!env.IsDevelopment())
            {
                app.UseHsts();
            }

            app.UseHttpsRedirection();
            app.UseStaticFiles();

            app.UseCookiePolicy();

            app.UseAuthentication();

            app.UseMvc(routes => {
                routes.MapRoute(
                    name: "default",
                    template: "wiki/{action}/{id?}",
                    defaults: new { controller = "Wiki", action = "Index" }
                );

                routes.MapRoute(
                    name: "read",
                    template: "{*location}",
                    defaults: new { controller = "Wiki", action = "Read" }
                );
            });
        }
    }
}