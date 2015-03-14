﻿using System.ComponentModel.DataAnnotations;

namespace microwiki.Models
{
    public class DocumentUpdateViewModel
    {
        [Required]
        public string ID { get; set; }
        [Required]
        public string ParentID { get; set; }
        [Required]
        public string Title { get; set; }
        public string Body { get; set; }

        public string Slug { get; set; }

        public bool IsRoot { get; set; }
    }
}