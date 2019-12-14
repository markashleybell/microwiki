using System;
using System.Collections.Generic;
using System.Linq;
using static MicroWiki.Functions.Functions;

namespace MicroWiki.Domain
{
    public class Document
    {
        public Document(
            Guid id,
            Guid? parentID,
            string title,
            string body,
            string slug,
            IEnumerable<Tag> tags)
            : this(
                  id,
                  parentID,
                  title,
                  body,
                  slug,
                  default,
                  tags,
                  default,
                  default,
                  default)
        {
        }

        public Document(
            Guid id,
            Guid? parentID,
            string title,
            string body,
            string slug,
            string location,
            string tags,
            string username,
            DateTime created,
            DateTime updated)
            : this(
                  id,
                  parentID,
                  title,
                  body,
                  slug,
                  location,
                  TagList(tags),
                  username,
                  created,
                  updated,
                  null)
        {
        }

        public Document(
            Guid id,
            Guid? parentID,
            string title,
            string body,
            string slug,
            string location,
            IEnumerable<Tag> tags,
            string username,
            DateTime created,
            DateTime updated)
            : this(
                  id,
                  parentID,
                  title,
                  body,
                  slug,
                  location,
                  tags,
                  username,
                  created,
                  updated,
                  null)
        {
        }

        private Document(
            Guid id,
            Guid? parentID,
            string title,
            string body,
            string slug,
            string location,
            IEnumerable<Tag> tags,
            string username,
            DateTime created,
            DateTime updated,
            IEnumerable<ChildDocument> children)
        {
            ID = id;
            ParentID = parentID;
            Title = title;
            Body = body;
            Slug = slug;
            Location = location;
            Tags = tags ?? Enumerable.Empty<Tag>();
            Username = username;
            Created = created;
            Updated = updated;
            Children = children ?? Enumerable.Empty<ChildDocument>();
        }

        public Guid ID { get; }

        public Guid? ParentID { get; }

        public string Title { get; }

        public string Body { get; }

        public string Slug { get; }

        public string Location { get; }

        public IEnumerable<Tag> Tags { get; }

        public string Username { get; }

        public DateTime Created { get; }

        public DateTime Updated { get; }

        public IEnumerable<ChildDocument> Children { get; }

        public Document WithChildren(IEnumerable<ChildDocument> children) =>
            new Document(
                ID,
                ParentID,
                Title,
                Body,
                Slug,
                Location,
                Tags,
                Username,
                Created,
                Updated,
                children
            );
    }
}
