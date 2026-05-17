# Debug Airtable Formula

## Trigger
When user asks to debug or fix an Airtable formula error.

## Steps

1. **Identify the error type**
   - `#ERROR` → Syntax or reference issue
   - `NaN` → Division 0/0 or invalid date math
   - `Infinity` → Division X/0
   - `Circular reference` → Field references itself

2. **Check common issues**
   - [ ] Balanced parentheses `()`
   - [ ] Balanced braces `{}`
   - [ ] Balanced quotes `""` or `''`
   - [ ] No smart/curly quotes
   - [ ] No comments (`//` or `/* */`)
   - [ ] Field names spelled correctly
   - [ ] All function names valid

3. **Add guards for runtime errors**
   - Division: `IF({D}=0, BLANK(), {N}/{D})`
   - Dates: `IF({Date}=BLANK(), BLANK(), ...)`
   - Errors: `IF(ISERROR(expr), fallback, expr)`

4. **Test the fix**
   - Save the formula
   - Check output in Airtable


---

# Create Airtable Formula

## Trigger
When user asks to create a new Airtable formula.

## Steps

1. **Understand requirements**
   - What fields are involved?
   - What is the expected output type?
   - Any edge cases (nulls, zeros, empty)?

2. **Choose approach**
   - Simple calculation → Direct operators
   - Conditional logic → IF or SWITCH
   - Text manipulation → String functions
   - Date calculations → DATETIME_* functions
   - Array operations → ARRAY* functions

3. **Build incrementally**
   - Start with core logic
   - Add null/error handling
   - Format output if needed

4. **Common patterns**
   ```
   // Safe division
   IF({Divisor}=0, BLANK(), {Value}/{Divisor})
   
   // Conditional text
   IF({Status}="Done", "✅", IF({Status}="In Progress", "🔄", "⬜"))
   
   // Date difference in days
   DATETIME_DIFF({End}, {Start}, 'days')
   
   // Join unique values
   ARRAYJOIN(ARRAYUNIQUE({Tags}), ", ")
   ```

5. **Validate**
   - Check syntax in VS Code extension
   - Test with sample data


---

# Convert Excel Formula to Airtable

## Trigger
When user wants to convert an Excel formula to Airtable.

## Common Conversions

| Excel | Airtable |
|-------|----------|
| `A1`, `B2` | `{Field Name}` |
| `VLOOKUP` | Use linked records + rollup |
| `HLOOKUP` | Use linked records + rollup |
| `SUMIF` | Use rollup field with SUM |
| `COUNTIF` | Use rollup field with COUNT |
| `IFERROR(x,y)` | `IF(ISERROR(x), y, x)` |
| `ISBLANK(x)` | `x = BLANK()` or `NOT(x)` |
| `TEXT(x,"fmt")` | `DATETIME_FORMAT(x, "fmt")` |
| `DATEVALUE` | `DATETIME_PARSE` |
| `CONCATENATE` | Same, or use `&` operator |
| `NOW()` | Same (callable constant) |
| `TODAY()` | Same (callable constant) |

## Steps

1. **Identify Excel functions used**
2. **Map to Airtable equivalents**
3. **Replace cell refs with field refs**
4. **Add error handling if needed**
5. **Test in Airtable**

## Not Available - Use Workarounds

- **VLOOKUP/HLOOKUP**: Create linked record field, then use rollup
- **SUMIF/COUNTIF**: Create linked records with filter, use rollup
- **INDIRECT**: Not available, restructure logic
- **OFFSET**: Not available, use ARRAYSLICE for arrays
