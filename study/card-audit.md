# Card Audit

Snapshot of every card in `index.html` (29 cards), to plan fixes and Series 3.

## Rules going forward

- **Series = art batch.** `series` on a card means which art style/batch it came from, not its subject.
- **Set = subject** (CPLR, Family Court Act, Criminal Procedure...).
- **Series 1 filter = the basic term cards only** (#001–#009). Memory Trick / rule cards (★) live under the
  **Memory Tricks** filter and their subject sets, whatever series their art is from.
- **Naming:** basic cards use a plain term (*Summons*). Rule cards are named after the rule in a short phrase
  (*8 Days Before*, *Quash It Where It Returns*).
- **Every rule card cites its source** (statute + where the rule text came from) and is checked against the statute.

## Inventory

| # | Name | Series | Set | Type | Source | Questions |
|---|------|--------|-----|------|--------|-----------|
| #001 | Overbooked Gavel | S1 | COURT PROCEDURES | basic | — none — | 27 |
| #002 | Paper Jam Prince | S1 | CORE: CHECKING | basic | — none — | 0 |
| #003 | Missing File Monster | S1 | CORE: FILING | basic | — none — | 0 |
| #004 | Summons | S1 | COURT TERMS | basic | — none — | 10 |
| #005 | Motion | S1 | COURT TERMS | basic | — none — | 9 |
| #006 | Affidavit | S1 | COURT TERMS | basic | — none — | 9 |
| #007 | Adjournment | S1 | COURT TERMS | basic | — none — | 9 |
| #008 | Calendar Call | S1 | COURT TERMS | basic | — none — | 9 |
| #009 | Judgment | S1 | COURT TERMS | basic | — none — | 9 |
| ★03 | Summons vs. Subpoena | S1 | LOOK-ALIKES | difference | — none — | 15 |
| ★04 | Who Signs the Summons? | S1 | FAMILY COURT ACT | who | FCA § 312.1 — NYS UCS Court Clerk Sample Questions (rev. 08/06/2026), Q4 | 9 |
| ★05 | The 60 / 90 Clock | S1 | UNIFORM RULES | clock | Uniform Rules § 205.43(b) — NYS UCS Court Clerk Sample Questions (rev. 08/06/2026), Q6 | 9 |
| ★06 | Conviction → What's Next? | S1 | CRIMINAL PROCEDURE | trigger | CPL § 720.20(1) — NYS UCS Court Clerk Sample Questions (rev. 08/06/2026), Q11 | 9 |
| ★07 | 8 Days Before | S1 | FAMILY COURT ACT | clock | FCA § 427(a) — NYS UCS Court Clerk Sample Questions (rev. 08/06/2026), Q2 | 9 |
| ★08 | Sealed in Your Favor | S1 | CRIMINAL PROCEDURE | trigger | CPL § 160.50(1) — NYS UCS Court Clerk Sample Questions (rev. 08/06/2026), Q10 | 9 |
| ★09 | Follow the Petitioner | S1 | FAMILY COURT ACT | who | FCA § 168.2 — NYS UCS Court Clerk Sample Questions (rev. 08/06/2026), Q3 | 9 |
| ★10 | Amend Once, No Permission | S1 | CPLR | clock | CPLR § 3025(a) — NYS UCS Court Clerk Sample Questions (rev. 08/06/2026), Q13 | 9 |
| ★11 | Who Speaks for the Child? | S1 | CPLR | chain | CPLR § 1201 — NYS UCS Court Clerk Sample Questions (rev. 08/06/2026), Q15 | 5 |
| ★12 | Custody or Not? | S1 | DOMESTIC RELATIONS LAW | difference | DRL § 75-a — NYS UCS Court Clerk Sample Questions (rev. 08/06/2026), Q5 | 9 |
| ★13 | Waive the Jury | S2 | CRIMINAL PROCEDURE | who | CPL § 320.10(2) — NYS UCS Court Clerk Sample Questions (rev. 08/06/2026), Q8 | 9 |
| ★14 | The Interest Clock | S2 | CPLR | difference | CPLR § 5003 — NYS UCS Court Clerk Sample Questions (rev. 08/06/2026), Q17 | 9 |
| ★15 | Quash It Where It Returns | S2 | CPLR | who | CPLR § 2304 — NYS UCS Court Clerk Sample Questions (rev. 08/06/2026), Q16 | 9 |
| ★16 | Mid-Trial Reset | S2 | CPLR | trigger | CPLR § 4402 — NYS UCS Court Clerk Sample Questions (rev. 08/06/2026), Q14 | 9 |
| ★17 | The School Gets Notified | S2 | CRIMINAL PROCEDURE | trigger | CPL § 380.90(2) — NYS UCS Court Clerk Sample Questions (rev. 08/06/2026), Q9 | 9 |
| ★18 | What Counts as Bail | S2 | CRIMINAL PROCEDURE | difference | CPL § 500.10(9) — NYS UCS Court Clerk Sample Questions (rev. 08/06/2026), Q7 | 9 |
| ★19 | 12 Months, Max | S2 | CRIMINAL PROCEDURE | clock | CPL § 170.56(1–2) — NYS UCS Court Clerk Sample Questions (rev. 08/06/2026), Q12 | 9 |
| ★20 | The Military Calendar | S2 | UNIFORM RULES | who | Uniform Rules § 202.22(a)(7) — NYS UCS Court Clerk Sample Questions (rev. 08/06/2026), Q18 | 9 |
| ★01 | Lawyers File Motions | S1 | FILING ORDER | chain | — none — | 0 |
| ★02 | Silly Clerks Drink Mocha | S1 | LIFE OF A CASE | chain | — none — | 0 |

## Findings

1. **Fixed:** ★03–★12 are rule cards with no `series` tag, so the Series 1 filter showed them next to the
   basic term cards. The Series 1 filter now shows only the basic cards; these cards still appear under
   Memory Tricks and their subject sets.
2. **Needs checking — unsourced questions.** The question banks on #001 and #004–#009 and on ★03 are marked
   "SAMPLE CONTENT — fact-check before real use" in the code. Check each against the study guide / statutes.
3. **Official sample questions are nearly used up.** Rule cards already use sample Q2–Q18. Series 3 needs new
   material — the subject list in the official study guide (see `README.md`) is the next source.
4. **Series 3 code prep (only when Series 3 is built).** Some code only knows about Series 2:
   the pack art (`series === 2 ? pack_s2 : pack`), the "next pack" checks, and the Series filter list.
   Each needs a small edit, plus `art/series3_badge.webp` and a pack image.
