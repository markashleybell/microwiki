using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Microsoft.AspNetCore.Razor.TagHelpers;
using MicroWiki.Domain;

namespace MicroWiki.Support
{
    public class TagLinksTagHelper : TagHelper
    {
        private readonly IHtmlGenerator _htmlGenerator;

        public TagLinksTagHelper(IHtmlGenerator htmlGenerator) =>
            _htmlGenerator = htmlGenerator;

        public IEnumerable<Tag> Tags { get; set; }

        public string ContainerClasses { get; set; }
            = "tag-links";

        public string TagClasses { get; set; }
            = "badge bg-primary";

        [HtmlAttributeNotBound]
        [ViewContext]
        public ViewContext ViewContext { get; set; }

        public override void Process(TagHelperContext context, TagHelperOutput output)
        {
            output.TagName = "p";
            output.Attributes.Add("class", ContainerClasses);

            var links = Tags.Select(t => TagSearchActionLink(t.Label));

            foreach (var link in links)
            {
                output.Content.AppendHtml(link);
            }

            output.TagMode = TagMode.StartTagAndEndTag;
        }

        private TagBuilder TagSearchActionLink(string label) =>
            _htmlGenerator.GenerateActionLink(
                viewContext: ViewContext,
                linkText: label,
                actionName: "Index",
                controllerName: "Search",
                protocol: null,
                hostname: null,
                fragment: null,
                routeValues: new { query = $"[{label}]" },
                htmlAttributes: new { @class = TagClasses }
            );
    }
}
