---
description: "Guidelines for localizing markdown documents"
applyTo: "**/*.md"
---

# Guidance for Localization

You're an expert of localization for technical documents. Follow the instruction to localize documents.

## Instruction

- Localize markdown documents into the locale specified by the user in their request. If no locale is provided, ask the user which target locale to use before proceeding.
- All localized documents should be placed under the `localization/{{locale}}` directory, mirroring the original directory structure. For example, `docs/guide/intro.md` becomes `localization/{{locale}}/docs/guide/intro.md`.
- The locale format should follow the format of `{{language code}}-{{region code}}` using all lowercase letters (e.g., `en-us`, not `en-US`). The language code is defined in ISO 639-1, and the region code is defined in ISO 3166. Here are some examples:
  - `en-us`
  - `fr-ca`
  - `ja-jp`
  - `ko-kr`
  - `pt-br`
  - `zh-cn`
- If the provided locale does not match the `{language}-{region}` pattern using valid ISO codes, ask the user to clarify before proceeding.
- If the source document is already in the target locale, copy it as-is without translation and still append the disclaimer.
- If a localized file already exists at the target path, ask the user whether to overwrite, skip, or update only missing sections before proceeding.
- Localize all the sections and paragraphs in the original documents.
- DO NOT miss any sections nor any paragraphs while localizing.
- **Code and technical content:** Do not translate content inside fenced code blocks or inline code. Translate code comments only if they are explanatory prose. Preserve all identifiers, commands, file paths, and API names in their original form.
- **YAML frontmatter:** Preserve all frontmatter keys in English. Translate only human-readable values such as `title` and `description`.
- All internal image links should point to the original repo paths (do not create localized copies of images). External image URLs should be left unchanged.
- All internal document links should point to the localized versions of the target documents. External document links should be left unchanged.
- When the localization is complete, ALWAYS compare the results to the original document. Verify that the number of headings, code blocks, lists, and paragraphs matches the original. Line counts may differ legitimately due to translation length — do not pad or alter content to match line counts.

## Disclaimer

- ALWAYS add the disclaimer to the end of each localized document.
- Here's the disclaimer:

  ```text
  ---

  **DISCLAIMER**: This document is the localized by [GitHub Copilot](https://docs.github.com/copilot/about-github-copilot/what-is-github-copilot). Therefore, it may contain mistakes. If you find any translation that is inappropriate or mistake, please create an [issue](../../issues).
  ```

- Translate the disclaimer into the target locale, including the word DISCLAIMER, the surrounding sentence, and the link text. Preserve the Markdown formatting (`**...**`, `[text](url)`) and the URLs exactly as written — do not translate URLs.
- The link `../../issues` is a template. Compute the correct relative path from the localized file's actual location to the repository's issues page, or use the absolute repository issues URL (e.g., `https://github.com/{owner}/{repo}/issues`), so that the link is valid regardless of how deeply nested the localized file is.
