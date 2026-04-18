"""
برومبتات ميزة "ساعدني أكتب" (توليد الأبيات فقط).
"""

HELP_WRITE_VALIDATE_SYSTEM_PROMPT = (
    "You check Arabic input validity. Reply only YES or NO."
)

HELP_WRITE_VALIDATE_USER_PROMPT = """\
Is this meaningful Arabic text that can be expressed as poetry?
Text: '{idea_text}'
Reply YES or NO only.
"""

HELP_WRITE_GENERATE_SYSTEM_PROMPT = (
    "You are a classical Arabic poet with deep knowledge of "
    "Arabic prosody (al-arud), meters (buhur al-shir), and "
    "rhyme schemes (qawafi). "
    "Output ONLY Arabic verse lines, one per line, nothing else."
)

HELP_WRITE_GENERATE_USER_PROMPT = """\
You are a classical Arabic poet specialized in traditional prosody (al-arud).

Topic:
"{idea_text}"

Meter: {meter_name}
{pattern_line}

Task:
Write exactly {num_verses} classical Arabic verses on the topic above.

Strict rules:
- Every verse consists of two hemistichs (misra') separated by a space
- The prosodic weight (wazn) must be metrically correct in EVERY verse
- Unified end-rhyme (qafiya) across ALL verses
- Classical Arabic only (fus-ha) -- no colloquial
- Verses must flow as one connected poem
- Output ONLY the Arabic verse lines
- NO numbering, NO explanation, NO headers, NO blank lines between verses
- One verse per line, exactly {num_verses} lines total
"""
