# docuforensiq-mcp

An MCP server that provides an AI-assisted forensic reasoning layer for **DocuForensIQ**.

It exposes a single tool, `analyze_document_evidence`, which accepts the structured evidence
package produced by `build_ai_analysis_input()` in `src/app.py` and returns:

- **Co-occurrence pattern analysis** — identifies cross-domain anomaly patterns that the
  per-observation rule engine cannot see
- **Evidentiary significance summary** — characterises the combined weight of all observations
  relative to the document type
- **Observation vs. interpretation distinctions** — separates what was recorded from what it
  may indicate, with explicit hedging
- **Prioritised next examination steps** — a ranked, de-duplicated list ordered by urgency
  given the full combination of observations
- **Uncertainty statement and disclaimer** — explicit in every response; never claims forgery

The rule-based `analyze_observations()` engine in `src/app.py` is the deterministic baseline
and is intentionally not duplicated here.

---

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or later

---

## Build

```bash
cd docuforensiq-mcp
npm install
npm run build
```

This compiles `src/index.ts` to `build/index.js`.

---

## Registration

The server is pre-registered in `.bob/mcp.json` at the workspace level.
After running `npm run build`, restart Bob (or reload the MCP panel) — the server will connect
automatically.

---

## Tool: `analyze_document_evidence`

### Input

Matches the output of `build_ai_analysis_input()` exactly:

| Field | Type | Required | Description |
|---|---|---|---|
| `case_id` | string | ✓ | Case identifier |
| `document_type` | string | ✓ | e.g. `"Financial Document"` |
| `observations` | string[] | ✓ | Observation keys from DocuForensIQ |
| `examiner_notes` | string | — | Free-text examiner notes |
| `rule_based_findings` | object[] | — | Output of `analyze_observations()` |

### Valid observation keys

```
Font inconsistency
Alignment or spacing irregularity
Signature-related anomaly
Ink or colour variation
Paper or print-quality anomaly
Possible text/date/number alteration
Suspicious digital metadata
Other unusual observation
```

### Output

```jsonc
{
  "case_id": "CASE-001",
  "document_type": "Financial Document",
  "anomaly_domains_affected": ["Typography Anomaly", "Content Alteration Indicator"],
  "observations_recorded": 2,
  "co_occurrence_patterns": [
    {
      "pattern_name": "Typographic change with content alteration indicator",
      "observations_involved": ["Font inconsistency", "Possible text/date/number alteration"],
      "pattern_significance": "...",
      "examination_priority": "high"
    }
  ],
  "evidentiary_significance": "...",
  "observations_vs_interpretations": [
    {
      "observation": "Font inconsistency",
      "anomaly_domain": "Typography Anomaly",
      "what_was_observed": "A typographic difference was noted...",
      "what_it_may_indicate": "May indicate that a portion of text was added..."
    }
  ],
  "prioritised_next_steps": [
    { "priority": 1, "step": "...", "rationale": "..." }
  ],
  "uncertainty_statement": "...",
  "disclaimer": "This analysis does not constitute expert forensic opinion..."
}
```

---

## Important limitations

- All reasoning is deterministic and rule-graph-based. No LLM or external API is called.
- The tool cannot examine the physical document, perform instrument-based analysis, or substitute
  for expert judgment.
- **Observations alone are insufficient to determine document authenticity.** This is stated
  explicitly in every response.
