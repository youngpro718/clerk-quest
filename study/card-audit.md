# Clerk Quest card audit

Audit of the 29 cards defined in `../index.html` on 2026-09-28. “Questions” counts authored entries in each card's `bank`; cards marked **generated** create questions in code and therefore have zero authored bank entries.

| Card | Name | Series | Set | Type | Source/status | Questions |
|---|---|---:|---|---|---|---:|
| #001 | Overbooked Gavel | 1 | Court Procedures | Court terminology | **Unchecked** — fact-check before real use | 27 |
| #002 | Paper Jam Prince | 1 | Core: Checking | Generated comparison | Generated skill questions; no cited rule | 0 |
| #003 | Missing File Monster | 1 | Core: Filing | Generated filing | Generated skill questions; no cited rule | 0 |
| #004 | Summons | 1 | Court Terms | Court term | **Unchecked** — fact-check before real use | 10 |
| #005 | Motion | 1 | Court Terms | Court term | **Unchecked** — fact-check before real use | 9 |
| #006 | Affidavit | 1 | Court Terms | Court term | **Unchecked** — fact-check before real use | 9 |
| #007 | Adjournment | 1 | Court Terms | Court term | **Unchecked** — fact-check before real use | 9 |
| #008 | Calendar Call | 1 | Court Terms | Court term | **Unchecked** — fact-check before real use | 9 |
| #009 | Judgment | 1 | Court Terms | Court term | **Unchecked** — fact-check before real use | 9 |
| ★01 | Lawyers File Motions | 1 | Filing Order | Chain mnemonic | Generated filing questions; no cited rule | 0 |
| ★02 | Silly Clerks Drink Mocha | 1 | Life of a Case | Chain mnemonic | Study model; no cited rule | 0 |
| ★03 | Summons vs. Subpoena | 1 | Look-Alikes | Difference | **Unchecked** — fact-check before real use | 15 |
| ★04 | Who Signs the Summons? | 1 | Family Court Act | Who | FCA § 312.1; official sample Q4 | 9 |
| ★05 | The 60 / 90 Clock | 1 | Uniform Rules | Clock | Uniform Rules § 205.43(b); official sample Q6 | 9 |
| ★06 | Conviction → What's Next? | 1 | Criminal Procedure | Trigger | CPL § 720.20(1); official sample Q11 | 9 |
| ★07 | 8 Days Before | 1 | Family Court Act | Clock | FCA § 427(a); official sample Q2 | 9 |
| ★08 | Sealed in Your Favor | 1 | Criminal Procedure | Trigger | CPL § 160.50(1); official sample Q10 | 9 |
| ★09 | Follow the Petitioner | 1 | Family Court Act | Who | FCA § 168.2; official sample Q3 | 9 |
| ★10 | Amend Once, No Permission | 1 | CPLR | Clock | CPLR § 3025(a); official sample Q13 | 9 |
| ★11 | Who Speaks for the Child? | 1 | CPLR | Chain | CPLR § 1201; official sample Q15 | 5 |
| ★12 | Custody or Not? | 1 | Domestic Relations Law | Difference | DRL § 75-a; official sample Q5 | 9 |
| ★13 | Waive the Jury | 2 | Criminal Procedure | Who | CPL § 320.10(2); official sample Q8 | 9 |
| ★14 | The Interest Clock | 2 | CPLR | Difference | CPLR § 5003; official sample Q17 | 9 |
| ★15 | Quash It Where It Returns | 2 | CPLR | Who | CPLR § 2304; official sample Q16 | 9 |
| ★16 | Mid-Trial Reset | 2 | CPLR | Trigger | CPLR § 4402; official sample Q14 | 9 |
| ★17 | The School Gets Notified | 2 | Criminal Procedure | Trigger | CPL § 380.90(2); official sample Q9 | 9 |
| ★18 | What Counts as Bail | 2 | Criminal Procedure | Difference | CPL § 500.10(9); official sample Q7 | 9 |
| ★19 | 12 Months, Max | 2 | Criminal Procedure | Clock | CPL § 170.56(1–2); official sample Q12 | 9 |
| ★20 | The Military Calendar | 2 | Uniform Rules | Who | Uniform Rules § 202.22(a)(7); official sample Q18 | 9 |

## Naming rules

- Keep a stable card number and internal `id`. Ordinary cards use `#NNN`; Memory Trick cards use `★NN`. Series, rarity, and level are separate fields and must stay separately visible.
- Use one clear exam concept per card. The card title may be playful, but the source citation must identify the precise rule.
- Card artwork belongs in `art/<art-slug>_<level>.*`. Keep the illustration separate from the app-drawn frame, title, rarity, stars, XP, and study text.
- Series changes the artwork and scene; it does not move the fixed card information.

## Sourcing rules

- Official-rule cards must quote the exact source text, cite the statute or rule, and identify the source document and sample-question number. Do not add legal facts beyond the quoted text.
- Verify each new question, answer, hint, explanation, and study note against the cited text before it becomes real study content. A mnemonic must reflect the rule, not change it.
- The questions on **#001, #004–#009, and ★03** remain unchecked. Compare them with an official study guide before real use. Generated skill questions and the ★02 study model also need their intended exam scope labeled clearly.
- The current official-rule cards cover sample questions **Q2–Q18**. Do not treat those samples as a complete question bank. For Series 3, start with the official Court Clerk (JG-20) subject list, then obtain the applicable statute or rule text from an official source, including NY Senate legislation where relevant.
- Court Officer-Trainee sample questions illustrate a different exam's format only. Paid prep courses and shared flashcards can suggest topics, but verify every fact against official material before making a card.

Current local official references: `../Court_Clerk_Exam_Subject_Matter.pdf` and `../Court_Clerk_Exam_Questions.pdf`.

## Rules going forward

- **Series = art batch.** `series` on a card means which art style/batch it came from, not its subject.
- **Set = subject** (CPLR, Family Court Act, Criminal Procedure...).
- **Series 1 filter = the basic term cards only** (#001–#009). Memory Trick / rule cards (★) live under the
  **Memory Tricks** filter and their subject sets, whatever series their art is from.
- **Naming:** basic cards use a plain term (*Summons*). Rule cards are named after the rule in a short phrase
  (*8 Days Before*, *Quash It Where It Returns*).
- **Every rule card cites its source** (statute + where the rule text came from) and is checked against the statute.

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
