import streamlit as st
import json
import re
# -----------------------------
# Page configuration
# -----------------------------
st.set_page_config(
    page_title="DocuForensIQ",
    page_icon="📄",
    layout="wide"
)

# -----------------------------
# Forensic Analysis Engine
# -----------------------------
def analyze_observations(observations):
    
    analysis_rules = {
        "Font inconsistency": {
            "category": "Typography Anomaly",
            "explanation": (
                "A difference in font family, size, weight, spacing, "
                "or text characteristics may indicate that a portion "
                "of the document was added or modified."
            ),
            "next_step": (
                "Compare font family, size, weight, spacing, baseline "
                "alignment, and surrounding text characteristics."
            )
        },

        "Alignment or spacing irregularity": {
            "category": "Layout Anomaly",
            "explanation": (
                "Unusual alignment or spacing may indicate insertion, "
                "replacement, or modification of document content."
            ),
            "next_step": (
                "Compare margins, line spacing, character spacing, "
                "baseline alignment, and positioning with surrounding text."
            )
        },

        "Signature-related anomaly": {
            "category": "Signature Anomaly",
            "explanation": (
                "Differences in signature characteristics may require "
                "comparison with authenticated reference signatures."
            ),
            "next_step": (
                "Compare line quality, proportions, stroke characteristics, "
                "pen pressure indicators, and other signature features."
            )
        },

        "Ink or colour variation": {
            "category": "Ink / Printing Anomaly",
            "explanation": (
                "Differences in ink colour or printing characteristics "
                "may indicate different writing or printing processes."
            ),
            "next_step": (
                "Examine ink characteristics, colour differences, "
                "printing method, and overlapping strokes where applicable."
            )
        },

        "Paper or print-quality anomaly": {
            "category": "Physical Document Anomaly",
            "explanation": (
                "Differences in paper characteristics or print quality "
                "may require examination of the physical document."
            ),
            "next_step": (
                "Examine paper type, texture, thickness, printing quality, "
                "and physical characteristics under suitable conditions."
            )
        },

        "Possible text/date/number alteration": {
            "category": "Content Alteration Indicator",
            "explanation": (
                "Changes involving dates, numbers, or text may indicate "
                "possible modification of document content."
            ),
            "next_step": (
                "Compare surrounding text characteristics and examine "
                "the affected area for evidence of alteration."
            )
        },

        "Suspicious digital metadata": {
            "category": "Digital Metadata Anomaly",
            "explanation": (
                "Unexpected metadata values may provide information about "
                "document creation, modification, or processing history."
            ),
            "next_step": (
                "Inspect metadata fields such as creation time, modification "
                "time, software information, author information, and file history."
            )
        },

        "Other unusual observation": {
            "category": "Other Observation",
            "explanation": (
                "The examiner has identified an observation that does not "
                "fit the predefined categories."
            ),
            "next_step": (
                "Document the observation clearly and determine whether "
                "additional physical, digital, or comparative examination is required."
            )
        }
    }

    results = []

    for observation in observations:
        if observation in analysis_rules:
            rule = analysis_rules[observation]

            results.append({
                "observation": observation,
                "category": rule["category"],
                "explanation": rule["explanation"],
                "next_step": rule["next_step"]
            })

    return results

# -----------------------------
# AI Analysis Input Builder
# -----------------------------
def extract_bob_number(text, label):
    if not text:
        return "—"

    pattern = rf"\|\s*{re.escape(label)}\s*\|\s*(\d+)"
    match = re.search(pattern, text)

    if match:
        return int(match.group(1))

    return "—"
def extract_concern_level(text):
    if not text:
        return "—"

    match = re.search(
        r"### Concern Level.*?\*\*([^*]+)\*\*",
        text,
        re.DOTALL
    )

    if match:
        return match.group(1).strip()

    return "—"
def build_ai_analysis_input(
    case_id,
    document_type,
    observations,
    notes,
    analysis_results
):
    """
    Creates a structured evidence package that can later
    be sent to an AI analysis service or IBM Bob workflow.
    """

    ai_input = {
        "case_id": case_id,
        "document_type": document_type,
        "observations": observations,
        "examiner_notes": notes,
        "rule_based_findings": analysis_results,
        "analysis_instruction": (
            "Analyze the documented observations and rule-based findings. "
            "Identify relationships between observations, explain why the "
            "combination may require further forensic examination, and "
            "suggest appropriate next examination steps. Do not conclude "
            "that the document is forged solely from these observations."
        )
    }

    return ai_input
# -----------------------------
# Header
# -----------------------------
st.title("📄 DocuForensIQ")
st.subheader("AI-Powered Forensic Document Examination Assistant")

st.write(
    "A guided workflow for recording and analyzing potential "
    "forensic document anomalies."
)

st.divider()

# -----------------------------
# Case Information
# -----------------------------
st.header("1. Case Information")

col1, col2 = st.columns(2)

with col1:
    case_id = st.text_input(
        "Case ID",
        placeholder="Example: CASE-001"
    )

with col2:
    document_type = st.selectbox(
        "Document Type",
        [
            "Select document type",
            "Identity Document",
            "Certificate",
            "Contract",
            "Property Document",
            "Financial Document",
            "Academic Document",
            "Government Document",
            "Other"
        ]
    )

st.divider()

# -----------------------------
# Document Observations
# -----------------------------
st.header("2. Forensic Observations")

st.write(
    "Select the observations noticed during the preliminary "
    "examination of the document."
)

col1, col2 = st.columns(2)

with col1:
    font_issue = st.checkbox(
        "Font or typography inconsistency"
    )

    alignment_issue = st.checkbox(
        "Text alignment or spacing irregularity"
    )

    signature_issue = st.checkbox(
        "Signature mismatch or unusual signature characteristics"
    )

    ink_issue = st.checkbox(
        "Ink or colour variation"
    )

with col2:
    paper_issue = st.checkbox(
        "Paper or print-quality anomaly"
    )

    alteration_issue = st.checkbox(
        "Possible alteration of dates, numbers or text"
    )

    metadata_issue = st.checkbox(
        "Suspicious digital metadata"
    )

    other_issue = st.checkbox(
        "Other unusual observation"
    )

# -----------------------------
# Detailed Notes
# -----------------------------
st.header("3. Examiner Notes")

notes = st.text_area(
    "Describe what you observed",
    placeholder=(
        "Example: The font used for the date appears different "
        "from the surrounding text..."
    ),
    height=150
)

# -----------------------------
# Analyze button
# -----------------------------
st.divider()

if st.button("🔍 Analyze Observations", type="primary"):

    observations = []

    if font_issue:
        observations.append("Font inconsistency")

    if alignment_issue:
        observations.append("Alignment or spacing irregularity")

    if signature_issue:
        observations.append("Signature-related anomaly")

    if ink_issue:
        observations.append("Ink or colour variation")

    if paper_issue:
        observations.append("Paper or print-quality anomaly")

    if alteration_issue:
        observations.append("Possible text/date/number alteration")

    if metadata_issue:
        observations.append("Suspicious digital metadata")

    if other_issue:
        observations.append("Other unusual observation")

    # -----------------------------
    # Validation
    # -----------------------------
    if not case_id:
        st.warning("Please enter a Case ID.")

    elif document_type == "Select document type":
        st.warning("Please select a document type.")

    elif not observations:
        st.warning(
            "Please select at least one observation "
            "before starting the analysis."
        )

    else:

        # -----------------------------
        # Recorded observations
        # -----------------------------
        st.success("Observations recorded successfully.")

        st.subheader("📋 Recorded Observations")

        for observation in observations:
            st.write(f"• {observation}")

        if notes:
            st.subheader("📝 Examiner Notes")
            st.write(notes)

        st.divider()

        # -----------------------------
        # Rule-based forensic analysis
        # -----------------------------
        st.header("4. Forensic Analysis")

        analysis_results = analyze_observations(observations)

        for index, result in enumerate(analysis_results, start=1):

            st.subheader(
                f"🔎 Finding {index}: {result['observation']}"
            )

            col1, col2 = st.columns(2)

            with col1:
                st.markdown("**Anomaly Category**")
                st.info(result["category"])

            with col2:
                st.markdown("**Assessment**")
                st.warning("Potential anomaly — requires further examination")

            st.markdown("**Possible Explanation**")
            st.write(result["explanation"])

            st.markdown("**Recommended Next Examination**")
            st.write(result["next_step"])

            st.divider()

        # -----------------------------
                # Forensic caution
        # -----------------------------
        # AI Analysis Preparation
        # -----------------------------
        st.header("5. AI-Assisted Analysis")

        st.write(
            "The structured examination findings below can be provided "
            "to an AI analysis service for explainable forensic reasoning."
        )

        st.info(
            "Next step: provide this structured evidence package to IBM Bob. "
            "Bob can use the DocuForensIQ MCP server to perform "
            "cross-observation forensic reasoning and return an "
            "explainable examination assessment."
        )

        st.markdown("### 🤖 IBM Bob Analysis Workflow")

        st.write(
            "1. DocuForensIQ records the examiner's observations."
        )

        st.write(
            "2. The observations and rule-based findings are converted "
            "into a structured evidence package."
        )

        st.write(
            "3. IBM Bob receives the evidence package and can invoke "
            "`analyze_document_evidence` through the DocuForensIQ MCP server."
        )

        st.write(
            "4. The MCP server analyzes relationships between observations "
            "and produces prioritized forensic examination guidance."
        )

        st.write(
            "5. Bob returns an explainable analysis without independently "
            "declaring the document forged."
        )

        ai_input = build_ai_analysis_input(
            case_id,
            document_type,
            observations,
            notes,
            analysis_results
        )

        with st.expander("View structured AI analysis input"):
            st.json(ai_input)

        ai_prompt = json.dumps(
            ai_input,
            indent=2
        )

        st.download_button(
            label="📥 Download AI Analysis Input",
            data=ai_prompt,
            file_name=f"{case_id}_ai_analysis_input.json",
            mime="application/json"
        )

        st.subheader("⚠️ Examination Note")

        st.info(
            "The findings generated by this assistant represent "
            "potential anomaly indicators based on the observations "
            "entered by the examiner. They do not independently "
            "establish that a document is forged. Further examination "
            "by a qualified forensic document examiner may be required."
        )
 # -----------------------------
# Import IBM Bob Analysis
# -----------------------------

st.divider()

st.header("6. Import IBM Bob Analysis")

st.write(
    "After IBM Bob completes the MCP analysis, "
    "import the structured analysis result here."
)

st.markdown("### 📁 Option 1 — Upload Bob's JSON")

uploaded_analysis = st.file_uploader(
    "Upload the Bob analysis JSON file",
    type=["json"],
    help="Upload the structured JSON returned by IBM Bob."
)

st.markdown("### 📋 Option 2 — Paste Bob's Analysis")

pasted_analysis = st.text_area(
    "Paste the complete Bob analysis here",
    height=350,
    placeholder="Paste the complete analysis returned by IBM Bob..."
)

# -----------------------------
# Submit button
# -----------------------------

submit_bob = st.button(
    "🚀 Submit Bob Analysis",
    type="primary"
)

# -----------------------------
# Process Bob analysis
# -----------------------------

if submit_bob:

    bob_analysis_text = None

    # Uploaded JSON
    if uploaded_analysis is not None:

        raw_content = uploaded_analysis.read().decode("utf-8")

        try:
            bob_data = json.loads(raw_content)

            bob_analysis_text = json.dumps(
                bob_data,
                indent=2
            )

        except json.JSONDecodeError:

            st.error(
                "The uploaded JSON file is not valid JSON."
            )

    # Pasted analysis
    elif pasted_analysis.strip():

        bob_analysis_text = pasted_analysis.strip()

    # Nothing provided
    else:

        st.warning(
            "Please upload Bob's JSON or paste Bob's analysis "
            "before submitting."
        )

    # -----------------------------
    # Display Bob result
    # -----------------------------

    if bob_analysis_text:

        st.success(
            "Bob analysis submitted successfully."
        )

        st.subheader(
            "📊 IBM Bob Forensic Analysis"
        )

        # -----------------------------
        # Extract summary values
        # -----------------------------

        observations_count = extract_bob_number(
            bob_analysis_text,
            "Observations Recorded"
        )

        anomaly_domains_count = extract_bob_number(
            bob_analysis_text,
            "Domain Spread"
        )

        cross_observation_count = extract_bob_number(
            bob_analysis_text,
            "Cross-Observation Patterns Triggered"
        )

        high_priority_count = extract_bob_number(
            bob_analysis_text,
            "High-Priority Patterns"
        )

        concern_level = extract_concern_level(
            bob_analysis_text
        )

        # -----------------------------
        # Analysis Summary
        # -----------------------------

        st.markdown("### 📌 Analysis Summary")

        col1, col2, col3, col4 = st.columns(4)

        with col1:
            st.metric(
                "Observations",
                observations_count
            )

        with col2:
            st.metric(
                "Anomaly Domains",
                anomaly_domains_count
            )

        with col3:
            st.metric(
                "Cross-Observation Patterns",
                cross_observation_count
            )

        with col4:
            st.metric(
                "High-Priority Patterns",
                high_priority_count
            )

        st.divider()

        # -----------------------------
        # Concern Level
        # -----------------------------

        st.subheader("⚠️ Concern Level")

        if str(concern_level).upper() == "ELEVATED":
            st.warning("🟠 ELEVATED")
        elif str(concern_level).upper() == "HIGH":
            st.error("🔴 HIGH")
        elif str(concern_level).upper() == "LOW":
            st.success("🟢 LOW")
        else:
            st.info(concern_level)

        st.divider()

        # -----------------------------
        # Key Findings
        # -----------------------------

        st.subheader("🔎 Key Findings")

        # Extract the Key Findings section from Bob's analysis
        key_findings_match = re.search(
            r"### Key Findings\s*(.*?)(?=### Cross-Observation Relationships)",
            bob_analysis_text,
            re.DOTALL
        )

        if key_findings_match:

            key_findings_text = key_findings_match.group(1).strip()

            st.markdown(key_findings_text)

        else:

            st.info(
                "No Key Findings section was detected in the Bob analysis."
            )
    st.divider()

        # -----------------------------
        # Complete Bob Analysis
        # -----------------------------

    with st.expander(
            "🔍 View Complete IBM Bob Analysis",
            expanded=False
        ):

            st.markdown(
                bob_analysis_text
            )

        # -----------------------------
        # Forensic Disclaimer
        # -----------------------------

    st.divider()

    st.subheader("⚖️ Forensic Disclaimer")

    st.info(
            "These findings represent potential anomaly indicators "
            "based on the observations provided. They do not establish "
            "that a document is forged, altered, or inauthentic. "
            "Further examination by a qualified forensic document "
            "examiner may be required."
        )