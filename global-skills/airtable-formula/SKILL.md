# Airtable Formula Skill

Expert assistance for writing, debugging, and optimizing Airtable formulas.

## When to Use

- Writing new Airtable formulas
- Debugging formula errors (#ERROR, NaN, Infinity)
- Optimizing complex nested formulas
- Converting Excel formulas to Airtable syntax
- Working with `.formula` files

## Key Differences from Excel

| Excel | Airtable |
|-------|----------|
| `VLOOKUP` | Use linked records |
| `SUMIF/COUNTIF` | Use rollup fields |
| `IFERROR` | `IF(ISERROR(...), ...)` |
| `NOW()` / `TODAY()` | Same, but callable constants |
| Cell references `A1` | Field references `{Field Name}` |

## Common Patterns

### Safe Division
```
IF({Divisor} = 0, BLANK(), {Value} / {Divisor})
```

### Null-Safe Field
```
IF({Field}, {Field}, "default")
```

### JSON Object
```
"{" &
  "\"id\": \"" & RECORD_ID() & "\"," &
  "\"name\": \"" & SUBSTITUTE({Name}, "\"", "\\\"") & "\"" &
"}"
```

### SWITCH vs Nested IF
```
// Instead of deeply nested IF:
SWITCH({Status}, "A", 1, "B", 2, "C", 3, 0)
```

## Error Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `#ERROR` | Syntax/reference issue | Check quotes, brackets, field names |
| `NaN` | 0/0 or invalid date | Add null checks |
| `Infinity` | X/0 | Check divisor ≠ 0 |
| Smart quotes | Curly quotes `""` | Use straight quotes `""` |

## Function Categories

1. **Text**: CONCATENATE, LEFT, RIGHT, MID, SUBSTITUTE, TRIM, UPPER, LOWER
2. **Numeric**: SUM, AVERAGE, ROUND, MAX, MIN, COUNT, ABS, MOD
3. **Date/Time**: TODAY, NOW, DATEADD, DATETIME_DIFF, DATETIME_FORMAT
4. **Logical**: IF, SWITCH, AND, OR, NOT, ISERROR
5. **Array**: ARRAYJOIN, ARRAYUNIQUE, ARRAYCOMPACT, ARRAYSLICE
6. **Regex**: REGEX_MATCH, REGEX_EXTRACT, REGEX_REPLACE
7. **Record**: RECORD_ID, CREATED_TIME, LAST_MODIFIED_TIME
