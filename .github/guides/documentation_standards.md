# AI-Parsable Documentation Standards

## Overview
This guide defines our documentation structure optimized for both human readability and AI parsing capabilities.

## Documentation Structure
1. All documentation should be located in the following directories:
   - `.github/docs/` - Project-level documentation
   - `.github/guides/` - How-to guides and tutorials
   - `.github/api/` - API documentation
   - `.github/examples/` - Examples and use cases

2. Each documentation file should follow this format:
   - Title (H1)
   - Overview/Summary (brief paragraph)
   - Table of Contents (for longer documents)
   - Content sections (H2, H3, etc.)
   - Related links

## AI-Optimized Formatting
1. Use semantic markdown consistently
2. Begin each file with a clear title and summary
3. Use proper heading hierarchy (H1 > H2 > H3...)
4. Include machine-readable metadata in frontmatter:
   ```yaml
   ---
   title: Document Title
   category: Category
   tags: [tag1, tag2]
   related: [doc1.md, doc2.md]
   ---
   ```

## Internal Linking System
1. Use relative paths for internal links
2. Reference documents should use this format:
   `[Document Name](../path/to/document.md)`
3. API references should use:
   `[API Function](../api/function.md#method)`

## Dynamic Indexing
Documentation is automatically indexed through our documentation pipeline that:
1. Scans all markdown files in documentation directories
2. Extracts metadata and builds relationship graphs
3. Generates navigation structure and search indices
4. Updates all internal links as needed