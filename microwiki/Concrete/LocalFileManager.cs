using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;
using MicroWiki.Abstract;
using MicroWiki.Support;
using static MicroWiki.Functions.Functions;

namespace MicroWiki.Concrete
{
    public class LocalFileManager : IFileManager
    {
        private readonly Settings _cfg;

        private readonly string _imageLibraryPhysicalPath;
        private readonly string _imageLibraryRelativePath;

        public LocalFileManager(
            IWebHostEnvironment hostingEnvironment,
            IOptionsMonitor<Settings> optionsMonitor)
        {
            _cfg = optionsMonitor.CurrentValue;

            _imageLibraryRelativePath = _cfg.LocalFileManagerLibraryFolderPath;

            _imageLibraryPhysicalPath = Path.Combine(
                hostingEnvironment.WebRootPath,
                _imageLibraryRelativePath.Trim('/').Replace('/', '\\')
            );
        }

        public async Task<string> UploadFile(IFormFile file, Func<string, string> fileNameTransform = null)
        {
            if (file == null)
            {
                throw new ArgumentNullException(nameof(file));
            }

            if (file.Length == 0)
            {
                throw new ArgumentOutOfRangeException(nameof(file), "File has zero length.");
            }

            var transform = fileNameTransform ?? new Func<string, string>(s => s);

            var sourcePath = file.FileName;

            var destinationFilePathOriginal = Path.Combine(_imageLibraryPhysicalPath, transform(Path.GetFileName(sourcePath)));

            var destinationFilePath = File.Exists(destinationFilePathOriginal)
                ? Path.Combine(_imageLibraryPhysicalPath, $"{transform(Path.GetFileNameWithoutExtension(sourcePath))}-{GetUniqueCode()}{Path.GetExtension(sourcePath)}")
                : destinationFilePathOriginal;

            using (var stream = new FileStream(destinationFilePath, FileMode.CreateNew))
            {
                await file.CopyToAsync(stream);
            }

            return $"{_imageLibraryRelativePath}/{Path.GetFileName(destinationFilePath)}";
        }

        public void DeleteFile(string fileName)
        {
            var filePath = $@"{_imageLibraryPhysicalPath}\{Path.GetFileName(fileName)}";

            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
        }

        public IEnumerable<string> GetFiles() =>
            Directory.EnumerateFiles(_imageLibraryPhysicalPath)
                .Select(f => $"{_imageLibraryRelativePath}/{Path.GetFileName(f)}");
    }
}
