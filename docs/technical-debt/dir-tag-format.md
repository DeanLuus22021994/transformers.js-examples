# DIR.TAG Format Guide

## Overview

The DIR.TAG format is a structured approach to tagging technical debt in code. It provides a way to categorize and organize debt items by directory path and hashtags, making it easier to track and manage technical debt across the codebase.

## Format

The basic format of a DIR.TAG is:

```
DIR.TAG: /path/to/category #tag1 #tag2 #tag3
```

### Components

1. **Directory Path** (`/path/to/category`):
   - Represents the logical category or area of the technical debt
   - Uses a filesystem-like path structure for hierarchical organization
   - Examples: `/performance`, `/refactor/api`, `/security/auth`

2. **Hashtags** (`#tag1 #tag2 #tag3`):
   - Provide additional metadata and classification
   - Can be used for filtering and grouping debt items
   - Examples: `#optimization`, `#security-risk`, `#memory-leak`

## Examples

```javascript
// DIR.TAG: /performance #optimization #bottleneck
function slowFunction() {
  // This function has performance issues
}

// DIR.TAG: /security/authentication #vulnerability #high-priority
const weakEncryption = "insecure"; // Needs to be replaced with strong encryption

// DIR.TAG: /refactor/api #deprecated #breaking-change
class OldApiClient {
  // This class uses a deprecated API that will be removed soon
}
```

## Recommended Categories

Here are some recommended top-level categories:

1. `/performance` - Performance issues and optimizations
2. `/security` - Security vulnerabilities and concerns
3. `/refactor` - Code that needs restructuring
4. `/architecture` - Architectural debt
5. `/testing` - Testing gaps and improvements
6. `/accessibility` - Accessibility issues
7. `/ui-ux` - User interface and experience issues
8. `/documentation` - Documentation gaps or improvements
9. `/dependencies` - Dependency management issues
10. `/tech-stack` - Technology stack modernization needs

## Recommended Tags

Here are some recommended tags:

1. `#high-priority` - Needs immediate attention
2. `#low-hanging-fruit` - Easy to fix
3. `#breaking-change` - Will require breaking changes
4. `#optimization` - Performance optimization
5. `#memory-usage` - Memory consumption issues
6. `#deprecated` - Uses deprecated APIs or patterns
7. `#complexity` - Overly complex code
8. `#maintainability` - Difficult to maintain
9. `#scalability` - Issues with scaling
10. `#workaround` - Temporary workaround

## Benefits of DIR.TAG

The DIR.TAG format offers several advantages over simple debt markers:

1. **Structured Organization**: Organizes debt by logical categories
2. **Hierarchical Classification**: Supports nested categories
3. **Flexible Tagging**: Allows multiple dimensions of classification
4. **Easy Filtering**: Simplifies filtering and searching
5. **Better Reporting**: Enables more sophisticated reporting
6. **Clear Priority Communication**: Conveys priority and context
7. **Integration Friendly**: Works well with automated tools

## Integration with Jest Scanner

The DIR.TAG format is fully supported by the Jest-based technical debt scanner. The scanner:

1. Detects DIR.TAG markers
2. Parses the directory path and hashtags
3. Includes this information in reports
4. Enables filtering by category and tags

## Best Practices

1. **Be Consistent**: Use consistent naming conventions for paths and tags
2. **Be Specific**: Choose specific paths and tags that clearly convey the issue
3. **Be Concise**: Keep paths and tags short but descriptive
4. **Add Context**: Include enough information to understand the issue
5. **Update Regularly**: Remove or update tags as debt is addressed

## Migration from Simple Markers

If you've been using simple markers like `#debt:`, consider migrating to the DIR.TAG format:

```javascript
// Old format:
// #debt: This function is inefficient and needs optimization

// New format:
// DIR.TAG: /performance/algorithms #optimization #efficiency
```

The scanner supports both formats, making it easy to transition gradually.
