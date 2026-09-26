import streamlit as st

# -----------------------------
# Page configuration
# -----------------------------
st.set_page_config(
    page_title="DocuForensIQ",
    page_icon="📄",
    layout="wide"
)

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
        st.success("Observations recorded successfully.")

        st.subheader("📋 Recorded Observations")

        for observation in observations:
            st.write(f"• {observation}")

        if notes:
            st.subheader("📝 Examiner Notes")
            st.write(notes)

        st.info(
            "These observations indicate areas requiring further "
            "examination. They do not by themselves establish that "
            "a document is forged."
        )