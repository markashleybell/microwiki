using System.Diagnostics.CodeAnalysis;

[assembly: SuppressMessage(
    category: "Design",
    checkId: "RCS1090: Add call to 'ConfigureAwait' (or vice versa).",
    Justification = "ASP.NET Core has no synchronisation context, and this isn't a library.")]
