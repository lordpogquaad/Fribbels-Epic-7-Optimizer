# TASK005 — Localization (ko-kr)

**Status:** Completed  
**Added:** 2026-06-01  
**Updated:** 2026-06-01

## Original Request

Translate `1. App/README.md` (the main app README, 428 lines) to Korean and place the output at `localization/ko-kr/1. App/README.md`. The audit instruction used was `localization.instructions.md`.

## Thought Process

Epic Seven is a Korean-origin game, and `data/locales/ko/` already contains Korean UI strings, making `ko-kr` the natural first locale to produce. The main challenges were:

1. TOC anchor links — GitHub slugifies heading text, so Korean headings need re-slugified anchors.
2. Code blocks — must be preserved verbatim (the gear score formula is an indented block, not a fenced block).
3. External URLs — 12 imgur image links and multiple external page links must not be altered.
4. Pre-existing TOC orphan (`설정 단계` → no matching heading in the source) — preserved as-is.

## Implementation Plan

- [x] Translate all prose to Korean
- [x] Preserve code block (gear score formula) verbatim in English
- [x] Preserve all 12 external image URLs
- [x] Preserve all external page links
- [x] Update TOC anchors to match Korean heading text (GitHub-compatible slugs)
- [x] Preserve pre-existing TOC orphan (`설정 단계`)
- [x] Append Korean disclaimer at end of document
- [x] Create output directory and file

## Progress Tracking

**Overall Status:** Completed — 100%

### Subtasks

| ID  | Description                         | Status   | Updated    | Notes                               |
| --- | ----------------------------------- | -------- | ---------- | ----------------------------------- |
| 5.1 | Translate prose to Korean           | Complete | 2026-06-01 |                                     |
| 5.2 | Preserve code blocks verbatim       | Complete | 2026-06-01 | Gear score formula (indented block) |
| 5.3 | Preserve external image/page URLs   | Complete | 2026-06-01 | 12 imgur links + external links     |
| 5.4 | Update TOC anchors                  | Complete | 2026-06-01 | GitHub-compatible Korean slugs      |
| 5.5 | Create output file in new directory | Complete | 2026-06-01 | `localization/ko-kr/1. App/`        |

## Progress Log

### 2026-06-01

- Source file reviewed: `1. App/README.md` (428 lines)
- Locale chosen: `ko-kr` — Epic Seven is Korean-origin; `data/locales/ko/` already present
- All checklist items completed in a single pass
- Output written to `localization/ko-kr/1. App/README.md`
- Korean disclaimer appended confirming this is a machine-assisted translation
