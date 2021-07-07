using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace MicroWiki.Abstract
{
    public interface IFileManager
    {
        Task<string> UploadFile(IFormFile file, Func<string, string> fileNameTransform = null);

        void DeleteFile(string fileName);

        IEnumerable<string> GetFiles();
    }
}
