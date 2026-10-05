# Official-text source manifest

This directory contains public New York government source material collected for the Court Clerk (JG-20) examination blueprint. The blueprint is `../Court_Clerk_Exam_Subject_Matter.pdf`, issued May 4, 2026, and tests rules and procedures in effect on **May 31, 2026**.

All Senate PDFs and extracted Markdown were retrieved on **October 5, 2026**. The extractions still require human review against the May 31, 2026 exam cutoff; later amendments may appear in the retrieved text.

## Statutes

| Source | Blueprint scope | Local readable text | Retained official PDFs | Coverage |
|---|---|---|---:|---|
| Family Court Act | Articles 1 (Parts 1, 5, 6, 7), 2 (Parts 1, 2, 4, 5, 6), 3 (Parts 1, 2, 4, 5, 6, 7, 8), 4, 5, 5-B, 6, 7, 8, 10, 11 | `Family-Court-Act-exam-scope.md` | 517 in `fca-sections/` | Complete against the official Senate article/part tables of contents used for enumeration; exam-cutoff review pending |
| Real Property Actions and Proceedings Law | Article 7 | `RPAPL-Article-7.md` | 32 in `rpapl7-sections/` | Complete against the official Senate Article 7 table of contents; exam-cutoff review pending |
| Vehicle and Traffic Law | Sections 511, 1192, 1193 | `VTL-511-1192-1193.md` | 3 at this directory level | All three requested sections collected; exam-cutoff review pending |
| Mental Hygiene Law | Articles 9, 10, 81 | `Mental-Hygiene-Law-Articles-9-10-81.md` | 93 in `mhl-sections/` | 93 section texts collected from the official Senate tables of contents. Section 9.61 is listed by the Article 9 table of contents, but its section PDF endpoint returned the whole-law table of contents rather than section text; it is excluded and unresolved. Exam-cutoff review pending |

The Senate section-PDF URL pattern is:

- Family Court Act: `https://legislation.nysenate.gov/pdf/laws/FCT{section}`
- RPAPL: `https://legislation.nysenate.gov/pdf/laws/RPA{section}`
- VTL: `https://legislation.nysenate.gov/pdf/laws/VAT{section}`
- Mental Hygiene Law: `https://legislation.nysenate.gov/pdf/laws/MHY{section}`

The official Mental Hygiene Law table-of-contents endpoints used to establish the census were `MHYTBA9`, `MHYTBA10`, and `MHYTEA81` under the same Senate PDF base URL.

## Uniform Rules for the New York State Trial Courts

The requested blueprint scope is:

- Part 200: sections 200.1-200.9.
- Part 202: sections 202.2, 202.3, 202.5, 202.6, 202.8, 202.9, 202.12, 202.13, 202.16, 202.19, 202.21, 202.22, 202.26, 202.27, 202.28, 202.33, 202.42, 202.48, 202.56, and 202.70.
- Part 205: sections 205.2-205.5, 205.7-205.11, 205.14, 205.15, 205.17, 205.24-205.26, 205.29, 205.34-205.37, 205.42-205.44, 205.49, 205.51-205.53, 205.59, 205.62, 205.64-205.66, 205.80, 205.81, and 205.85.

Complete, consolidated official text could not be retrieved because the New York Courts rules pages presented a browser security-verification page. No challenge was bypassed, and no secondary-source text was substituted.

The `uniform-rules/` directory therefore contains only clearly labeled partial official material:

- `part-202-selected-excerpts.md`: verified excerpts from sections 202.8(e) and 202.22; it is not the full requested Part 202 scope.
- `part-205-indexed-fragments.md`: incomplete fragments from the indexed official Part 205 page; omissions and discontinuities remain.
- `nys-register-2025-12-10.pdf` and `205.43-amendment-2025-12-10-excerpt.md`: an official Department of State publication and excerpt for the amendment to section 205.43, effective January 5, 2026. This is an amendment publication, not a complete consolidated rule.

Part 200 and all Uniform Rules sections not explicitly identified above remain uncollected. The partial material must not be treated as a complete statement of the exam-scope rules.

## Validation notes

- Whole-law and article-level Senate PDFs often contain only tables of contents. Those were used for enumeration but are not presented here as statutory text.
- Retained section PDFs were checked as PDFs and text-extracted before inclusion in the readable Markdown files.
- The Markdown preserves the official PDF text and line wrapping. It is a convenience copy; use the retained official PDF when exact formatting matters.
- No credentials, private data, developer audit material, or secondary-source statutory text is included.

Whole-law contents-only PDFs are retained in `tables-of-contents/`, with explicit filenames.
