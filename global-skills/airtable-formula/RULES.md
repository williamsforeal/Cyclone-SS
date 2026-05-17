---
description: Always use Airtable Formula skill when working with .formula files
globs: ["**/*.formula"]
alwaysApply: true
---

# Airtable Formula Rules

When working with Airtable formulas:

1. **Use the Airtable Formula skill** for all formula-related tasks
2. **No comments allowed** - Airtable doesn't support // or /* */
3. **Field references use braces** - `{Field Name}` not cell references
4. **Smart quotes break formulas** - Always use straight quotes `"`
5. **Division needs guards** - Check for zero: `IF({D}=0, BLANK(), {N}/{D})`

## Quick Reference

- **Safe division**: `IF({Divisor}=0, BLANK(), {Value}/{Divisor})`
- **Error handling**: `IF(ISERROR(expr), fallback, expr)`
- **Date formatting**: `DATETIME_FORMAT({Date}, "YYYY-MM-DD")`
- **Join arrays**: `ARRAYJOIN(ARRAYUNIQUE({Tags}), ", ")`

## Not Available in Airtable

- VLOOKUP, HLOOKUP (use linked records)
- SUMIF, COUNTIF (use rollups)
- IFERROR (use IF(ISERROR(...)))
- Cell references (A1, B2)
