#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
// ---------------------------------------------------------------------------
// Domain taxonomy
// Maps each observation key (as produced by build_ai_analysis_input in
// src/app.py) to its anomaly domain, a plain-language observation statement,
// and a hedged interpretation statement.
// ---------------------------------------------------------------------------
const OBSERVATION_PROFILES = {
    "Font inconsistency": {
        domain: "Typography Anomaly",
        domainCode: "TYPO",
        observationStatement: "A typographic difference was noted in font characteristics relative to surrounding text.",
        interpretationStatement: "May indicate that a portion of text was added or substituted after original document production; requires comparative typographic examination to assess.",
        examinationStep: "Compare font family, size, weight, spacing, baseline alignment, and surrounding text characteristics across the affected area.",
        stepPriority: 2,
    },
    "Alignment or spacing irregularity": {
        domain: "Layout Anomaly",
        domainCode: "LAYOUT",
        observationStatement: "Unusual alignment or spacing was noted relative to the surrounding document layout.",
        interpretationStatement: "May indicate insertion, replacement, or repositioning of content; comparative layout analysis is required before drawing any conclusions.",
        examinationStep: "Compare margins, line spacing, character spacing, baseline alignment, and element positioning with the surrounding text and document template norms.",
        stepPriority: 3,
    },
    "Alignment/spacing irregularity": {
        domain: "Layout Anomaly",
        domainCode: "LAYOUT",
        observationStatement: "An alignment or spacing irregularity was noted in the document relative to the surrounding text or layout.",
        interpretationStatement: "May indicate that content was inserted, replaced, or repositioned after original document production; layout irregularities are not independently conclusive and require comparative examination.",
        examinationStep: "Compare margins, line spacing, character spacing, baseline alignment, and element positioning with surrounding text and document template norms.",
        stepPriority: 3,
    },
    "Signature-related anomaly": {
        domain: "Signature Anomaly",
        domainCode: "SIG",
        observationStatement: "An anomalous characteristic was observed in a signature or signature-adjacent area of the document.",
        interpretationStatement: "May require comparison with authenticated reference signatures; differences in stroke, proportion, or pen pressure are not individually conclusive of inauthenticity.",
        examinationStep: "Obtain authenticated reference signatures and compare line quality, proportions, stroke characteristics, and pen pressure indicators under magnification.",
        stepPriority: 1,
    },
    "Ink or colour variation": {
        domain: "Ink / Printing Anomaly",
        domainCode: "INK",
        observationStatement: "A difference in ink colour or printing characteristics was observed relative to surrounding content.",
        interpretationStatement: "May indicate different writing instruments, printing processes, or production sessions; chemical or spectroscopic examination may be needed to characterise the difference.",
        examinationStep: "Examine ink characteristics and colour differences under visible and non-visible light; assess printing method and check for overlapping strokes where applicable.",
        stepPriority: 2,
    },
    "Paper or print-quality anomaly": {
        domain: "Physical Document Anomaly",
        domainCode: "PHYS",
        observationStatement: "A difference in paper or print quality was observed that is atypical for the document type.",
        interpretationStatement: "May require physical examination of the document substrate; differences in paper texture or print quality can have benign explanations such as scanning artefacts or storage conditions.",
        examinationStep: "Examine paper type, texture, thickness, and printing quality under suitable lighting and magnification; physical laboratory examination may be required.",
        stepPriority: 4,
    },
    "Possible text/date/number alteration": {
        domain: "Content Alteration Indicator",
        domainCode: "CONTENT",
        observationStatement: "A potential change to dates, numbers, or text content was noted in the document.",
        interpretationStatement: "May indicate modification of document content after original production; this observation is not independently conclusive and must be corroborated by physical or digital examination.",
        examinationStep: "Compare surrounding text characteristics and examine the affected area closely for evidence of erasure, overwriting, or digital manipulation.",
        stepPriority: 1,
    },
    "Suspicious digital metadata": {
        domain: "Digital Metadata Anomaly",
        domainCode: "META",
        observationStatement: "Unexpected or inconsistent values were noted in the document's digital metadata.",
        interpretationStatement: "May provide information about document creation, modification, or processing history; metadata can be set intentionally and is not independently conclusive of alteration.",
        examinationStep: "Inspect metadata fields including creation time, modification time, software version, author information, and revision history; correlate with stated document provenance.",
        stepPriority: 2,
    },
    "Other unusual observation": {
        domain: "Other Observation",
        domainCode: "OTHER",
        observationStatement: "The examiner recorded an observation that does not correspond to a predefined anomaly category.",
        interpretationStatement: "Significance is indeterminate without further characterisation; the examiner's notes should be reviewed to determine what additional examination is appropriate.",
        examinationStep: "Review the examiner's notes and determine whether additional physical, digital, or comparative examination is required to characterise the observation.",
        stepPriority: 5,
    },
};
const CO_OCCURRENCE_RULES = [
    {
        domainCodes: ["TYPO", "CONTENT"],
        patternName: "Typographic change with content alteration indicator",
        significance: "Typography anomalies co-occurring with a content alteration indicator suggest that a change to the document text may have been accompanied by a font or spacing difference. This combination warrants close comparative examination of the affected area for both typographic consistency and evidence of content substitution.",
        priority: "high",
    },
    {
        domainCodes: ["TYPO", "LAYOUT"],
        patternName: "Typographic and layout co-occurrence",
        significance: "Font inconsistencies appearing alongside layout or spacing irregularities may indicate that text was inserted or replaced in a way that disturbed the surrounding layout. Both dimensions should be examined together rather than independently.",
        priority: "medium",
    },
    {
        domainCodes: ["SIG", "CONTENT"],
        patternName: "Signature anomaly with content alteration indicator",
        significance: "A signature anomaly observed alongside a content alteration indicator raises the question of whether the signature and the content it purportedly authenticates were produced at the same time. Reference signature comparison and content examination should be conducted concurrently.",
        priority: "high",
    },
    {
        domainCodes: ["SIG", "INK"],
        patternName: "Signature anomaly with ink variation",
        significance: "Ink variation in or near a signature area is notable because ink characteristics can indicate whether a signature was applied contemporaneously with the surrounding document content. Ink examination should be conducted in conjunction with signature comparison.",
        priority: "high",
    },
    {
        domainCodes: ["META", "CONTENT"],
        patternName: "Digital metadata anomaly with content alteration indicator",
        significance: "Metadata inconsistencies co-occurring with a content alteration indicator may allow correlation between suspected document modification and recorded digital history. Metadata examination should explicitly seek to corroborate or contradict the content alteration observation.",
        priority: "high",
    },
    {
        domainCodes: ["META", "TYPO"],
        patternName: "Digital metadata anomaly with typographic anomaly",
        significance: "Typographic differences in a digital document, combined with metadata anomalies, may indicate that the document was edited after its stated creation. Metadata timeline should be compared against the typographic evidence.",
        priority: "medium",
    },
    {
        domainCodes: ["INK", "PHYS"],
        patternName: "Ink variation with physical document anomaly",
        significance: "Ink variation alongside a paper or print-quality anomaly may indicate that different production materials or processes were involved in different parts of the document. Physical laboratory examination of both the paper substrate and ink characteristics is advisable.",
        priority: "medium",
    },
    {
        domainCodes: ["CONTENT", "PHYS"],
        patternName: "Content alteration indicator with physical document anomaly",
        significance: "A content alteration indicator alongside a physical document anomaly may suggest that a physical modification method (such as erasure or chemical treatment) was used. Physical examination under UV and infrared light sources is advisable.",
        priority: "high",
    },
    {
        domainCodes: ["TYPO", "CONTENT", "META"],
        patternName: "Multi-layer anomaly: typography, content, and metadata",
        significance: "Three independent anomaly domains — typographic, content, and metadata — co-occurring represents the broadest spread of examination indicators in this evidence package. No single explanation is established, but the combination across multiple domains makes this a higher-priority case for structured forensic examination.",
        priority: "high",
    },
];
// ---------------------------------------------------------------------------
// Document-type examination context
// Provides document-specific framing for the evidentiary significance summary.
// ---------------------------------------------------------------------------
const DOCUMENT_TYPE_CONTEXT = {
    "Identity Document": "identity documents are high-value targets for alteration of personal data fields such as name, date of birth, and photograph",
    Certificate: "certificates are commonly examined for alterations to dates, issuing authority details, and recipient information",
    Contract: "contracts are frequently examined for alterations to monetary values, dates, party names, and signature areas",
    "Property Document": "property documents are commonly examined for alterations to ownership details, boundaries, valuations, and dates",
    "Financial Document": "financial documents are frequently examined for alterations to monetary amounts, dates, account details, and authorising signatures",
    "Academic Document": "academic documents are commonly examined for alterations to grades, dates, institution names, and recipient details",
    "Government Document": "government documents are examined with attention to issuing authority, official markings, dates, and unique identifiers",
};
// ---------------------------------------------------------------------------
// Zod input schema — mirrors the output of build_ai_analysis_input() exactly
// ---------------------------------------------------------------------------
const RuleBasedFindingSchema = z.object({
    observation: z.string().describe("The observation key"),
    category: z.string().describe("Anomaly category assigned by the rule engine"),
    explanation: z.string().describe("Rule engine explanation"),
    next_step: z.string().describe("Rule engine recommended next step"),
});
const InputSchema = z.object({
    case_id: z.string().describe("Case identifier assigned by the examiner"),
    document_type: z
        .string()
        .describe("Type of document under examination (e.g. Financial Document, Identity Document)"),
    observations: z
        .array(z.string())
        .min(1)
        .describe("List of observation keys recorded by the examiner. Must use the keys produced by DocuForensIQ (e.g. 'Font inconsistency', 'Possible text/date/number alteration')"),
    examiner_notes: z
        .string()
        .optional()
        .describe("Free-text notes recorded by the examiner during preliminary examination"),
    rule_based_findings: z
        .array(RuleBasedFindingSchema)
        .optional()
        .describe("Per-observation findings produced by the DocuForensIQ rule engine (analyze_observations). Providing these allows the MCP tool to reference the deterministic baseline in its reasoning."),
});
// ---------------------------------------------------------------------------
// Core analysis logic
// ---------------------------------------------------------------------------
function analyzeDocumentEvidence(input) {
    const { case_id, document_type, observations, examiner_notes, rule_based_findings, } = input;
    // 1. Resolve profiles for each observation present
    const resolvedProfiles = observations
        .filter((obs) => obs in OBSERVATION_PROFILES)
        .map((obs) => ({ key: obs, profile: OBSERVATION_PROFILES[obs] }));
    const unknownObservations = observations.filter((obs) => !(obs in OBSERVATION_PROFILES));
    // 2. Collect the affected anomaly domains
    const domainCodesPresent = new Set(resolvedProfiles.map((p) => p.profile.domainCode));
    const anomalyDomainsAffected = [
        ...new Set(resolvedProfiles.map((p) => p.profile.domain)),
    ];
    // 3. Evaluate co-occurrence patterns
    const triggeredPatterns = CO_OCCURRENCE_RULES.filter((rule) => rule.domainCodes.every((code) => domainCodesPresent.has(code))).map((rule) => ({
        pattern_name: rule.patternName,
        observations_involved: resolvedProfiles
            .filter((p) => rule.domainCodes.includes(p.profile.domainCode))
            .map((p) => p.key),
        pattern_significance: rule.significance,
        examination_priority: rule.priority,
    }));
    // 4. Observation vs. interpretation distinctions
    const observationsVsInterpretations = resolvedProfiles.map((p) => ({
        observation: p.key,
        anomaly_domain: p.profile.domain,
        what_was_observed: p.profile.observationStatement,
        what_it_may_indicate: p.profile.interpretationStatement,
    }));
    // Add any unknown observations with explicit indeterminate framing
    for (const obs of unknownObservations) {
        observationsVsInterpretations.push({
            observation: obs,
            anomaly_domain: "Unrecognised Observation",
            what_was_observed: `The examiner recorded: "${obs}". This observation key is not in the known taxonomy.`,
            what_it_may_indicate: "Significance cannot be assessed without further characterisation. Review the examiner notes for context.",
        });
    }
    // 5. Build prioritised next steps — de-duplicate by step text, rank by
    //    (a) whether the step is implicated in a high-priority co-occurrence pattern,
    //    (b) the base priority of the individual observation profile.
    const stepMap = new Map();
    const highPriorityDomainCodes = new Set(triggeredPatterns
        .filter((p) => p.examination_priority === "high")
        .flatMap((p) => resolvedProfiles
        .filter((rp) => p.observations_involved.includes(rp.key))
        .map((rp) => rp.profile.domainCode)));
    for (const { key, profile } of resolvedProfiles) {
        const isHighPriorityDomain = highPriorityDomainCodes.has(profile.domainCode);
        // Boost priority rank for observations implicated in high-priority patterns
        const effectivePriority = isHighPriorityDomain
            ? Math.max(1, profile.stepPriority - 1)
            : profile.stepPriority;
        if (!stepMap.has(profile.examinationStep)) {
            const ruleRef = rule_based_findings?.find((f) => f.observation === key)?.next_step;
            const rationale = isHighPriorityDomain
                ? `Elevated to higher priority because "${key}" is implicated in a co-occurrence pattern of significance. ${ruleRef ? "Rule engine baseline step: " + ruleRef : ""}`
                : `Recommended for "${key}" (${profile.domain}). ${ruleRef ? "Rule engine baseline step: " + ruleRef : ""}`;
            stepMap.set(profile.examinationStep, {
                step: profile.examinationStep,
                rationale: rationale.trim(),
                rank: effectivePriority,
            });
        }
        else {
            // Keep the lower (more urgent) rank if this observation also maps here
            const existing = stepMap.get(profile.examinationStep);
            if (effectivePriority < existing.rank) {
                existing.rank = effectivePriority;
            }
        }
    }
    const prioritisedNextSteps = [...stepMap.values()]
        .sort((a, b) => a.rank - b.rank)
        .map((entry, index) => ({
        priority: index + 1,
        step: entry.step,
        rationale: entry.rationale,
    }));
    // 6. Evidentiary significance summary
    const domainList = anomalyDomainsAffected.join(", ");
    const highPatternCount = triggeredPatterns.filter((p) => p.examination_priority === "high").length;
    const docContext = DOCUMENT_TYPE_CONTEXT[document_type] ??
        "this document type warrants careful examination of the recorded observations";
    let significanceSummary = `This evidence package records ${observations.length} observation(s) spanning ${anomalyDomainsAffected.length} anomaly domain(s) ` +
        `(${domainList}) for a ${document_type} (case ${case_id}). `;
    if (triggeredPatterns.length > 0) {
        significanceSummary +=
            `${triggeredPatterns.length} co-occurrence pattern(s) were identified across the recorded observations` +
                (highPatternCount > 0
                    ? `, of which ${highPatternCount} are rated high-priority for examination`
                    : "") +
                `. `;
    }
    else {
        significanceSummary +=
            "No multi-domain co-occurrence patterns were identified; the recorded observations are in separate anomaly domains. ";
    }
    significanceSummary +=
        `Given that ${docContext}, the examiner should direct attention to the prioritised examination steps below. ` +
            `The significance of these observations as a combination cannot be resolved without structured forensic examination.`;
    if (examiner_notes && examiner_notes.trim().length > 0) {
        significanceSummary +=
            ` Examiner notes are present and should be reviewed alongside these findings, as they may contain context that affects the interpretation of individual observations.`;
    }
    // 7. Uncertainty statement
    const uncertaintyStatement = "These findings represent an interpretive layer over preliminary observations recorded by the examiner. " +
        "Each observation is a potential indicator, not a confirmed finding. " +
        "Co-occurrence patterns and priority rankings are derived from structured rules and do not incorporate physical examination, " +
        "instrument-based analysis, or expert judgment. " +
        "The weight to be given to any individual observation or combination depends on factors not captured in this evidence package, " +
        "including the condition of the document, its provenance, and the context of examination. " +
        "All interpretations carry uncertainty and must be evaluated by a qualified forensic document examiner.";
    const disclaimer = "This analysis does not constitute expert forensic opinion. " +
        "It does not establish — and must not be interpreted as establishing — that the document is forged, altered, or inauthentic. " +
        "Observations alone are insufficient to determine document authenticity.";
    return {
        case_id,
        document_type,
        anomaly_domains_affected: anomalyDomainsAffected,
        observations_recorded: observations.length,
        co_occurrence_patterns: triggeredPatterns.length > 0
            ? triggeredPatterns
            : [
                {
                    pattern_name: "No multi-domain co-occurrence detected",
                    observations_involved: observations,
                    pattern_significance: "The recorded observations fall into separate anomaly domains with no identified cross-domain pattern. Each should be examined independently using the prioritised steps below.",
                    examination_priority: "low",
                },
            ],
        evidentiary_significance: significanceSummary,
        observations_vs_interpretations: observationsVsInterpretations,
        prioritised_next_steps: prioritisedNextSteps,
        uncertainty_statement: uncertaintyStatement,
        disclaimer,
        ...(unknownObservations.length > 0 && {
            unrecognised_observations: unknownObservations,
            unrecognised_observations_note: "These observation keys were not found in the known taxonomy. They are included in the output but could not be analysed for domain, co-occurrence, or prioritisation.",
        }),
    };
}
// ---------------------------------------------------------------------------
// MCP server
// ---------------------------------------------------------------------------
const server = new McpServer({
    name: "docuforensiq-mcp",
    version: "0.1.0",
});
server.tool("analyze_document_evidence", "Accepts the structured evidence package produced by DocuForensIQ's build_ai_analysis_input() " +
    "and provides an explainable forensic reasoning layer. Identifies co-occurring anomaly patterns " +
    "across observations, summarises their combined evidentiary significance, distinguishes observations " +
    "from interpretations, and returns prioritised next examination steps with explicit uncertainty " +
    "statements. Does not duplicate the rule-based analysis already performed by analyze_observations(). " +
    "Does not claim that observations alone prove forgery.", InputSchema.shape, async (input) => {
    try {
        const result = analyzeDocumentEvidence(input);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Analysis failed: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("docuforensiq-mcp running on stdio");
}
main().catch((error) => {
    console.error("Fatal error in docuforensiq-mcp:", error);
    process.exit(1);
});
