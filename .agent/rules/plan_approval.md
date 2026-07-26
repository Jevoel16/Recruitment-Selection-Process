---
description: Prevents auto-approval of /plan artifacts when the user adds comments.
---

# Plan Approval Rule

When executing the `/plan` slash command or working with an implementation plan artifact:
- Do NOT treat user comments, questions, or feedback in the chat as an implicit approval to proceed.
- If the user provides comments or feedback on the plan, you must update the plan and wait for explicit approval again.
- You must wait for the user to explicitly approve the plan (e.g., by clicking the "Proceed" button on the artifact, or explicitly typing an affirmative approval like "approved", "looks good to me", "proceed") before moving on to execution.
