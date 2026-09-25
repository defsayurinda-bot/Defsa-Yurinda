# Defsa Yurinda · Geotechnical tools and notes

[Bahasa Indonesia](README.md) · **English**

Code and writing for **[defsayurinda.github.io](https://defsayurinda.github.io/en/)**: geotechnical calculators with full step-by-step working, tools for soil mechanics lab data, practice problems, and notes on studying with Claude Code. The site itself is mostly in Indonesian.

## Tools

The table in the Indonesian [README](README.md#alat) is built automatically from [`konten/alat.json`](konten/alat.json) and shows the source status of each tool:

| Status | Meaning |
|---|---|
| Sumber asli | Formulas checked against the original source and tested with a textbook example |
| Sumber sekunder | Formulas taken from a source that cites the original |
| Belum terverifikasi | Sources incomplete or not yet checked |

## Repository layout

```
konten/     source text (Markdown), tool registry (alat.json), lab tool list (praktikum.json)
docs/       the published site (GitHub Pages)
skrip/      bangun_situs.py builds pages from konten/; buat.py creates a new tool or note
tests/      checks for calculations, practice problems, links, security, and the registry
```

## Licence

- **Code** (JavaScript, Python, CSS, HTML templates, workflows): [MIT](LICENSE).
- **Writing and images** (everything in `konten/`, page text, screenshots): [CC BY 4.0](LICENSE-TULISAN).

Please credit Defsa Yurinda and link to this repository.
