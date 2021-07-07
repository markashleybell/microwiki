using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using MicroWiki.Domain;
using static MicroWiki.Domain.Constants;
using static MicroWiki.Functions.Functions;

namespace MicroWiki.Models
{
    public class CreateViewModel : ViewModelBase
    {
        public CreateViewModel()
            : base("Create")
        {
        }

        [Required]
        public Guid ID { get; set; }

        [Required]
        public Guid? ParentID { get; set; }

        public string ParentTitle { get; set; }

        [Required]
        public string Title { get; set; }

        public string Tags { get; set; }

        public string Body { get; set; }

        public string Slug { get; set; }

        public bool IsPublic { get; set; }

        public IEnumerable<Tag> AllTags { get; set; }

        public MarkdownEditorViewModel MarkdownEditorData =>
            new MarkdownEditorViewModel { IsNew = true };

        public string TagDataJson =>
            AllTags?.AsTagJson(t => t.Label);

        public string FilenamePrefix =>
            ID.ToString();

        public static CreateViewModel From(Document parentDocument, IEnumerable<Tag> allTags) =>
            new CreateViewModel {
                ID = Guid.NewGuid(),
                ParentID = parentDocument.ParentID,
                ParentTitle = parentDocument.Title,
                AllTags = allTags,
                IsPublic = parentDocument.IsPublic
            };

        public static Document ToDocument(CreateViewModel model) =>
            new Document(
                model.ID,
                model.ParentID,
                model.Title,
                model.Body,
                CreateSlug(model.Title),
                (model.Tags ?? string.Empty)
                    .Split('|', StringSplitOptions.RemoveEmptyEntries)
                    .Select(t => new Tag(t)),
                model.IsPublic
            );
    }
}
