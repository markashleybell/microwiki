using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Html;
using MicroWiki.Domain;
using MicroWiki.Models;

namespace MicroWiki.Functions
{
    public static class Functions
    {
        public static bool IsImageFile(this string filePath) =>
            Regex.IsMatch(Path.GetExtension(filePath), @"\.(?:jpe?g|png|gif)", RegexOptions.IgnoreCase);

        public static string GetUniqueCode()
        {
            const string characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
            var ticks = DateTime.UtcNow.Ticks.ToString();

            var code = string.Empty;

            for (var i = 0; i < characters.Length; i += 2)
            {
                if ((i + 2) <= ticks.Length)
                {
                    var number = int.Parse(ticks.Substring(i, 2));

                    if (number > characters.Length - 1)
                    {
                        var one = double.Parse(number.ToString().Substring(0, 1));
                        var two = double.Parse(number.ToString().Substring(1, 1));

                        code += characters[Convert.ToInt32(one)];
                        code += characters[Convert.ToInt32(two)];
                    }
                    else
                    {
                        code += characters[number];
                    }
                }
            }

            return code;
        }

        public static string CreateSlug(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
            {
                return null;
            }

            const RegexOptions options = RegexOptions.IgnoreCase | RegexOptions.Singleline;

            // Remove all special chars (but not spaces or dashes)
            var output = Regex.Replace(input, @"[^a-z0-9\s\-]", string.Empty, options);

            // Replace spaces with hyphens
            output = Regex.Replace(output, @"[\s]", "-", options);

            // Replace multiple hyphens (more than one in a row) with a single hyphen
            output = Regex.Replace(output, @"\-{2,}", "-", options);

            // Trim extra hyphen off the end if exists
            output = output.TrimEnd('-');

            return output.ToLower();
        }

        public static SiteMapDocumentViewModel AsTree(
            this SiteMapDocument document,
            IEnumerable<SiteMapDocument> documents)
        {
            var children = documents.Where(d => d.ParentID == document.ID)
                .Select(c => c.AsTree(documents));

            return SiteMapDocumentViewModel.From(document).WithChildren(children);
        }

        public static HtmlString CreateSiteMapItemLinkHtml(SiteMapDocumentViewModel document, Guid? currentDocumentId = null)
        {
            // If an ID has been passed in, don't link the item for that document
            var itemContent = currentDocumentId != document.ID
                ? $"<a class=\"document\" href=\"{document.Location}\" data-id=\"{document.ID}\">{document.Title}</a>"
                : document.Title;

            return new HtmlString($"<i class=\"bi-file-earmark\"></i>{itemContent}");
        }

        public static HtmlString CreateSiteMapItemHtml(SiteMapDocumentViewModel document, Guid? currentDocumentId = null, bool showPrivate = false)
        {
            var childPageLinks = document.Children
                .Where(c => c.IsPublic || showPrivate)
                .Select(c => CreateSiteMapItemHtml(c, currentDocumentId));

            var childPageList = childPageLinks.Any()
                ? $"<ul>{string.Join(string.Empty, childPageLinks)}</ul>"
                : string.Empty;

            var html = $"<li>{CreateSiteMapItemLinkHtml(document, currentDocumentId)}{childPageList}</li>";

            return new HtmlString(html);
        }

        public static IEnumerable<Tag> TagList(string tags) =>
            !string.IsNullOrWhiteSpace(tags)
                ? tags.Split('|').Select(t => new Tag(t))
                : Enumerable.Empty<Tag>();

        public static string AsTagJson(this IEnumerable<Tag> tags, Func<Tag, object> transform) =>
            JsonSerializer.Serialize(tags.Select(transform));
    }
}
