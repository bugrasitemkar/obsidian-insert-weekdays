# Insert Week

An [Obsidian](https://obsidian.md) plugin that inserts a dated weekly template — one `## Weekday + ordinal` heading per day, each with an unticked checkbox underneath.

Use the **Insert week** command, choose which week of the year to insert, and pick whether weeks start on Monday or Sunday.

## Features

- **Command palette action** — run **Insert week** from anywhere in the editor.
- **Week picker** — a dropdown of every week in the year, labelled with its date range, pre-selected to the week of today.
- **Start day toggle** — Monday (default) or Sunday, changeable in the modal.
- **Persistent setting** — set the default start day once in **Settings → Insert Week**.
- **Live preview** — see the generated markdown before inserting.

### Output

For week 40 of 2026 with a Monday start:

```markdown
## Monday 28th

- [ ] 

## Tuesday 29th

- [ ] 

## Wednesday 30th

- [ ] 

## Thursday 1st

- [ ] 

## Friday 2nd

- [ ] 

## Saturday 3rd

- [ ] 

## Sunday 4th

- [ ] 
```

With a Sunday start, the same week begins on **Sunday 27th** instead.

## Usage

1. Open a note in the editor.
2. Open the command palette (`Cmd/Ctrl + P`) and run **Insert week**.
3. Pick the **week of the year** and the **start day of the week**.
4. Click **Insert** — the template is inserted at your cursor.

The week number is inferred from today's date, following ISO-8601 week numbering when the start day is Monday (week 1 is the week containing January 4th).

## Settings

| Setting | Description | Default |
| --- | --- | --- |
| Default start day of the week | Used every time the **Insert week** modal opens. | Monday |

## Installation

### Manual (from a release)

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/bugrasitemkar/obsidian-insert-weekdays/releases).
2. Copy them into `<your-vault>/.obsidian/plugins/insert-week/`.
3. Reload Obsidian and enable **Insert Week** under **Settings → Community plugins**.

### From source

```bash
git clone https://github.com/bugrasitemkar/obsidian-insert-weekdays.git
cd obsidian-insert-weekdays
npm install
npm run build
```

Then copy the folder into `<your-vault>/.obsidian/plugins/insert-week/` and enable it. During development you can symlink the repository into your vault's plugins folder and reload the app after each build.

## Development

```bash
npm install      # install dependencies
npm run dev      # watch build (outputs main.js)
npm run build    # typecheck + production build
npm test         # run the unit test suite (Vitest)
```

The date/week logic lives in `week.ts` and is covered by `week.test.ts`.

## Releasing

1. Bump `version` in `package.json` and `manifest.json` (keep them in sync).
2. Run `npm run build`.
3. Commit, tag the version (e.g. `git tag 1.0.0`), and push with tags.
4. Create a GitHub release for the tag and attach `main.js`, `manifest.json`, and `styles.css`.

## License

MIT
