using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MicroWiki.Abstract;
using MicroWiki.Models;

namespace MicroWiki.Controllers
{
    [Authorize]
    public class FilesController : ControllerBase
    {
        private readonly IRepository _repository;
        private readonly IFileManager _fileManager;

        public FilesController(
            IRepository repository,
            IFileManager fileManager)
        {
            _repository = repository;
            _fileManager = fileManager;
        }

        public IActionResult Upload(string uploadedFileName)
        {
            var model = new UploadViewModel {
                UploadedFileName = uploadedFileName,
                Files = _fileManager.GetFiles()
            };

            return View(model);
        }

        [HttpPost]
        public async Task<IActionResult> Upload(UploadViewModel model)
        {
            var file = model.UploadedFile;

            if (file == null)
            {
                return RedirectToAction(nameof(Upload));
            }

            var uploadedFilePath = await _fileManager.UploadFile(file, fn => $"{model.FileNamePrefix}-{fn}");

            return HttpContext.Request.Headers["X-Requested-With"] != "XMLHttpRequest"
                ? RedirectToAction(nameof(Upload), new { UploadedFileName = uploadedFilePath })
                : Json(new { UploadedFileName = uploadedFilePath });
        }

        [HttpPost]
        public async Task<IActionResult> DeleteUpload(DeleteUploadViewModel model)
        {
            var usedInLocations = await _repository.CheckFileUse(model.Location);

            if (usedInLocations.Any())
            {
                model.InUseByDocuments = usedInLocations;

                return View(model);
            }

            _fileManager.DeleteFile(model.Location);

            return RedirectToAction(nameof(Upload));
        }
    }
}
