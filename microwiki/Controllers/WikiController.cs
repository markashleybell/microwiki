using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.Extensions;
using Microsoft.AspNetCore.Mvc;
using MicroWiki.Abstract;
using MicroWiki.Functions;
using MicroWiki.Models;
using static MicroWiki.Functions.Functions;

namespace MicroWiki.Controllers
{
    public class WikiController : Controller
    {
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IRepository _repository;

        public WikiController(
            IHttpContextAccessor httpContextAccessor,
            IRepository repository)
        {
            _repository = repository;
            _httpContextAccessor = httpContextAccessor;
        }

        public override PartialViewResult PartialView(string name, object model) =>
            PartialView($"_{name}", model);

        public async Task<IActionResult> BreadcrumbTrail(Guid id)
        {
            var model = new BreadcrumbTrailViewModel {
                Segments = await _repository.GetBreadcrumbTrail(id),
                CurrentUrl = _httpContextAccessor.HttpContext.Request.GetDisplayUrl()
            };

            return PartialView(nameof(BreadcrumbTrail), model);
        }

        [HttpGet]
        public async Task<IActionResult> Create(Guid parentID)
        {
            var parentDocument = await _repository.ReadDocument(parentID);

            if (parentDocument == null)
            {
                return NotFound();
            }

            var model = CreateViewModel.From(parentDocument);

            return View(model);
        }

        [HttpPost]
        public async Task<IActionResult> Create(CreateViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var create = CreateViewModel.ToDocument(model, "markb");

            var document = await _repository.CreateDocument(create);

            return Redirect(document.Location);
        }

        public async Task<IActionResult> Read(string location)
        {
            var document = await _repository.ReadDocument(location);

            if (document == null)
            {
                return NotFound();
            }

            var breadcrumbTrailViewModel = new BreadcrumbTrailViewModel {
                Segments = await _repository.GetBreadcrumbTrail(document.ID),
                CurrentUrl = _httpContextAccessor.HttpContext.Request.GetDisplayUrl()
            };

            return View(ReadViewModel.From(document, breadcrumbTrailViewModel));
        }

        [HttpGet]
        public async Task<IActionResult> Update(Guid id)
        {
            var document = await _repository.ReadDocument(id);

            return document != null
                ? (IActionResult)View(UpdateViewModel.From(document))
                : NotFound();
        }

        [HttpPost]
        public async Task<IActionResult> Update(UpdateViewModel model)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var update = UpdateViewModel.ToDocument(model, "markb");

            var document = await _repository.UpdateDocument(update);

            return Redirect(document.Location);
        }

        [HttpPost]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _repository.DeleteDocument(id);

            return Redirect("/");
        }

        public async Task<IActionResult> Contents()
        {
            var model = new ContentsViewModel {
                Root = await GetSiteMap()
            };

            return View(model);
        }

        [HttpPost]
        public async Task<IActionResult> Move(Guid id, Guid newParentID)
        {
            var newLocation = await _repository.MoveDocument(id, newParentID);

            return Json(new { newLocation });
        }

        public async Task<IActionResult> MoveDocumentModal(Guid currentDocumentId, string currentDocumentTitle)
        {
            var model = new MoveDocumentModalViewModel {
                ID = currentDocumentId,
                Title = currentDocumentTitle,
                Root = await GetSiteMap()
            };

            return PartialView(nameof(MoveDocumentModal), model);
        }

        private async Task<SiteMapDocumentViewModel> GetSiteMap()
        {
            var documents = await _repository.ReadAllDocuments();

            var root = documents.Single(d => !d.ParentID.HasValue);

            return root.AsTree(documents);
        }
    }
}
