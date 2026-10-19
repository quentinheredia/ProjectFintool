# GitHub

How a change travels from a branch to `master`: branches, commits, the test that
proves each change, pull requests, CI, tags and releases.

What may change, and what nobody is allowed to do, is [SYSTEM.md](SYSTEM.md).
How the code is shaped is [ARCHITECTURE.md](ARCHITECTURE.md). What a person sees
is [DESIGN.md](DESIGN.md). What each command does is the README's **Run it**.

The model is GitHub flow. `master` is the only branch that lives. Every change
reaches it through a pull request of its own, in whatever order changes are
finished, and every change a person gets is tagged with its own name.

> **This file describes where the repository is going, not everywhere it is.**
> The remote is `github.com/quentinheredia/ProjectFintool` and the branch is
> `master`. The first two commits after the scaffold went straight to `master`,
> before this file existed; nothing is tagged yet. What is still missing is CI,
> the merge settings below, and a `test:fails-first` checker - so the rules
> here are held by the person merging and by nothing else.

GitHub enforces none of this on the free plan: no branch protection, no
rulesets, and a push straight to `master` would be accepted. **GitHub settings**
lists what to switch on when the plan allows it.

---

## The life of a change

1. **A branch per change**, cut from `master`: `feat/sources-drawer`.
2. **A test that fails**, as the first commit on a `feat` or `fix` branch. It
   asks for what the change will make true, and fails because that is not true
   yet (*A test that fails first*).
3. **Commits on it**, as many as the work needs, until that test passes.
4. **A draft pull request** into `master` as soon as there is something to push,
   so CI runs on every push from then on.
5. **Ready for review** once the local checks pass and the documents the change
   moves have moved.
6. **Merged into `master` by squash**, once it is reviewed and CI is green
   against `master` as it is at that moment. The branch is deleted.
7. **Tagged** with the next number and the branch's slug: `v0.02-sources-drawer`.

Any number of branches are open at once, and each merges when it is ready. None
waits for another:

```
master   feat/sources-drawer   fix/clamp-note   data/2026-q4
 o v0.01-first-story
 |-----+-----------------------------------------+
 |     o                                         o
 |     o                                         |
 |-----|--------------------+                    |
 |     o                    o                    |
 o<----+ squash             |                    |
 | v0.02-sources-drawer     |                    |
 o<-------------------------+ squash             o  rebased onto master
 | v0.02.1-clamp-note                            |
 o<----------------------------------------------+ rebase and merge
 | v0.03-2026-q4
```

`data/2026-q4` was started first and merged last. The others did not wait for
it.

Work bigger than one pull request is an issue or a milestone that pull requests
point at. It is never a branch that lives. A bug or an idea nobody has started
is an issue.

---

## Branches

`master` is the only branch that lives. Every commit on it came through a pull
request, passed CI, and runs with `npm run build && npm start`: anything on it
can ship. It is never pushed to directly, never rebased and never force-pushed.

Everything else is a branch per change, named `<kind>/<slug>`, cut from
`master`, merged into `master`, and deleted.

| Kind | For | Tagged when it merges |
|---|---|---|
| `feat` | Something a person can now do or see | Yes |
| `data` | A regenerated seed: a new year, a new series, a corrected anchor | Yes |
| `fix` | A bug | Yes |
| `refactor` | Structure, with behaviour unchanged | No |
| `docs` | Documents only | No |
| `ci` | The workflow, and scripts only CI runs | No |

The slug is kebab-case and becomes the tag's name, so it names what a person
gets, not the task: `feat/sources-drawer`, `data/2026-q4`, `fix/clamp-note`. Not
`feat/step-2`, not `wip`, not `fix-2`.

**Cut from `master`**, freshly pulled. **One concern** per branch: a bug found on
the way to a feature is its own branch, unless the feature cannot pass without
it. **Days, not weeks**: a feature too big for a few days lands in slices, each
leaving `master` working.

**Kept current by rebasing onto `master`.** A branch is its author's to rewrite;
`--force-with-lease` refuses if anyone else pushed to it in the meantime.

```bash
git fetch
git rebase origin/master
git push --force-with-lease
```

**Stacked**, when B needs A before A has merged: cut B from A and open B's pull
request against A. When A squash-merges, drop A's commits from B:

```bash
git rebase --onto origin/master feat/a feat/b
git push --force-with-lease
```

---

## Commits

**Subject**: `<area>: <what is now true>`. Lower case after the colon, no full
stop, under 72 characters. A squash merge appends ` (#12)`.

| Area | What is in it |
|---|---|
| `engine` | `src/lib/comparator-engine.ts`, `comparator-input.ts` - the formulas and what input is valid |
| `story` | `src/lib/story-content.ts`, `format.ts` - the words and how numbers print |
| `data` | `src/data`, `scripts/build-historical-seed.ts` - the figures and how they are made |
| `db` | `src/db`, `drizzle/`, `scripts/seed-db.ts` |
| `og` | `src/app/api/og` - the PNG renderer |
| `components` | `src/components` - everything rendered in the browser |
| `app` | `src/app` outside `api/og` - pages, layout, metadata |
| `lib` | the rest of `src/lib` |
| `e2e` | `e2e/`, `playwright.config.ts` |
| `docs` | `docs/`, `README.md` |
| `ci` | the workflow |

A change across several takes the one it is for. The subject says what is true
afterwards: `engine: a ratio below 1 prints two decimals`, not `fix formatting
bug`.

**Body**: a blank line, then *why*, wrapped at about 80 columns. The diff shows
what changed; the message says why it had to, and what was measured.

**Trailers**: `Co-Authored-By:` for everyone who wrote the change, Claude
included.

**Never committed**: secrets or a `.env` (only `.env.example`); `.next`;
`test-results/`; a lockfile change without the `package.json` change that caused
it.

**Commits that stay apart.** A regenerated `src/data/historical-seed.ts` goes in
a commit of its own, with the script's output quoted in the body, so a reader can
tell a changed formula from a changed figure. A pull request that holds one
merges by **rebase** rather than squash, so that the commit survives.

---

## A test that fails first

Every `feat` and `fix` branch carries a test that fails before the change and
passes after it. The two results together are the proof that the branch does
what its name says.

- **It is the branch's first commit**, on its own, before any of the code it
  tests: `engine: a test for a benchmark year before the data`.
- **It tests what the branch's name says**, at the level a person sees it: the
  card's number, the copy, the PNG's status and size, not a helper on the way.
- **A fix's test is the bug.** It fails on `master` the way the report describes.
- **It fails because the change is missing**, on an assertion or a missing
  export. A failure from a typo says nothing; read what the test printed.
- **It stays.** Once merged it fails again if the change is ever undone.

Where the test lives:

| Change | Test |
|---|---|
| A formula, a mode, a verdict | `src/lib/__tests__/comparator-engine.test.ts`, against the fixture table where the expected number can be worked out by hand |
| A URL or OG parameter | `src/lib/__tests__/og-card-params.test.ts` |
| Something stored | `src/db/__tests__/` |
| A rendered PNG | `e2e/og-card.api.spec.ts` - status, type, size read from the PNG header |
| Something a person does in the deck | `e2e/story.ui.spec.ts` |

> **There is no `npm run test:fails-first` yet.** The rule is enforced by the
> author and the reviewer reading the two runs.

A branch whose first commit came out wrong is rewritten so the test comes first:

```bash
git reset --soft origin/master
git commit -m "engine: a test for a benchmark year before the data" -- src/lib/__tests__/comparator-engine.test.ts
git commit -m "engine: a benchmark before 1965 is clamped and reported"
git push --force-with-lease
```

The other kinds:

- **`data`** has no failing test. What proves it is the script's output quoted
  in the commit, and the engine tests on the seed still passing. A figure that
  moved a card's verdict is said so in the pull request.
- **`refactor`**: its tests pass before and after, unchanged.
- **`docs`** and **`ci`** have none.

A `feat` that can only be seen gives a test nothing to fail on. One of its
commits says so in a trailer:

```
No-failing-test: the bento tile order; screenshots in the pull request
```

Screenshots at 390x844 and 1440x900, and the PNG for the same card, stand in for
the test.

---

## Before a pull request is ready

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

**Stop `npm run dev` before `npm run build`.** Both use `.next`, and a build
overwrites the chunks a running dev server is serving. If a build was killed
part way and the next one fails with `Invariant: no direct app page entry found`,
delete `.next` and build again.

Then, by what the change touches:

| If the change | Then also |
|---|---|
| Is a `feat` or `fix` | Its failing test, and the failure it printed, read |
| Touches the engine | The fixture-table tests for that card, worked by hand |
| Changes a card's words | The same card's PNG, in both formats, looked at |
| Changes what a person sees | Screenshots at 390x844 and 1440x900; no horizontal scroll |
| Regenerates the seed | The script's output in its own commit; SYSTEM.md if a series or anchor source changed |
| Adds a series or column | The schema, `row-mapping.ts`, `db:generate`, and the source in ARCHITECTURE.md's pipeline table |
| Changes a chart colour | The dataviz validator, run again for all four |
| Imports into a client component | `grep -l "Enter your birth year" .next/static/chunks/*.js` prints nothing |
| Changes a rule in SYSTEM.md | SYSTEM.md, in the same pull request |
| Changes the shape of the code | ARCHITECTURE.md |
| Changes what a person sees, structurally | DESIGN.md, with the reason |
| Adds an environment variable | `.env.example` |
| Adds a route or a query key | SYSTEM.md's **Routes** |

---

## Pull requests

```bash
gh pr create --draft --base master --title "<area>: <what is now true>"
```

**Title**: the subject the squash will write. **Draft first**, ready with
`gh pr ready` once the checks above pass. **Size**: one concern, small enough to
review in one sitting. A refactor and the behaviour change it makes room for are
two pull requests, the refactor first.

**Description**:

```markdown
One paragraph: what is true once this merges that was not before, and why.

Closes #<issue>.

## What is in it

- ...

## Checks

The test that fails first: its name, the failure it printed, and that it passes
now. What else ran and what it reported. For a change a person sees:
screenshots, and the PNG.

## Not in it

What is left for later, and where it is tracked. "Nothing" is an answer.
```

**Read the diff on GitHub before asking anyone to.** Most slips show there: a
debugging print, a stray screenshot, a regenerated seed nobody meant to change.

### Review

What the reviewer reads for, in this order:

1. **SYSTEM.md, Restrictions**: honesty above all. No invented figure, modeled
   labelled modeled, a surplus shown as a surplus, the hero agreeing with the
   copy. A break here blocks the merge.
2. **Correctness**: a `feat` or `fix` has a test that fails without it, for that
   reason.
3. **The documents the change moves.**
4. **SYSTEM.md, Code**: zod off the client, `src/db` off the client, Satori
   rules, shared geometry in one place.

Formatting is not a review topic. A comment that is a matter of taste starts
`nit:` and does not block.

With no second person, the author reads the diff on GitHub after a break, and
`/code-review` in Claude Code reads it too. The pull request's Checks section
says which review it had.

### Merging

A pull request merges when CI is green, it is reviewed, CI passed against
`master` as it is now, and `master` itself is green.

| Pull request | Method | Why |
|---|---|---|
| Any | **Squash** | One commit per pull request; one revert takes it out |
| One holding a regenerated seed | **Rebase and merge**, after tidying the branch | A squash would fold the figures into the change that caused them |

No merge commits: `master` stays a straight line.

### When CI fails

- `gh pr checks` lists the jobs; `gh run view <run-id> --log-failed` prints the
  failing step.
- The UI tests need a browser the runner has: `npx playwright install chromium`
  and `E2E_BROWSER_CHANNEL=chromium`. Locally they default to Edge.
- A test that fails and then passes on a re-run is a bug. One re-run to confirm;
  after that it is an issue.

---

## Tags and releases

Every `feat`, `data` and `fix` pull request is tagged when it merges, with the
branch's slug.

| Branch | Tag | Example |
|---|---|---|
| `feat/…`, `data/…` | The next number, then the slug | `v0.03-2026-q4` |
| `fix/…` | The last number with a patch number, then the slug | `v0.02.1-clamp-note` |
| `refactor/…`, `docs/…`, `ci/…` | None | |

Numbers are handed out at merge, not when a branch is cut. **The first tag is
still to be placed**: `v0.01-first-story`, on the commit where all four phases
and the query logging are on `master`.

```bash
git switch master
git pull --tags
git describe --tags --abbrev=0
gh pr view <n> --json mergeCommit --jq .mergeCommit.oid
git tag -a v0.03-2026-q4 <commit> -m "v0.03-2026-q4: <pull request title> (#<n>)"
git push origin v0.03-2026-q4
gh release create v0.03-2026-q4 --verify-tag --generate-notes
```

A tag is never moved and never reused. A fix after it is a new tag.

---

## When `master` breaks

1. **Revert the pull request that broke it**, as a pull request of its own,
   tagged as a fix if what it removes was tagged: `v0.03.1-revert-2026-q4`.
2. **The fix comes back as a new pull request**, with a test that would have
   caught it.

Revert first, fix after: the revert is known to work, and the fix is not yet.

---

## GitHub settings

On the free plan, under **Settings → General → Pull Requests**: squash and
rebase merging on, merge commits off, squash message from the pull request's
title and description, head branches deleted automatically, update-branch
suggested.

```bash
gh repo edit --enable-merge-commit=false --enable-rebase-merge --enable-squash-merge \
  --squash-merge-commit-message pr-title-description \
  --delete-branch-on-merge --allow-update-branch
```

When the plan allows: a branch ruleset on `master` (pull request required, the
CI checks required with the branch up to date, linear history, no force push, no
deletion) and a tag ruleset on `v*` (no updates, no deletion).

---

## Open

These belong to a person, not to this file.

- **`master` or `main`.** Renaming now costs one `gh` command and a local
  `git branch -m`; renaming after CI and deploys point at it costs more.
- **CI.** Typecheck, lint, unit tests, build, then the Playwright suite against
  the build.
- **Deploys.** Nothing deploys yet. The app has no custom server, so Vercel
  works as is; `NEXT_PUBLIC_SITE_URL` has to be set for link unfurls, and
  `DATABASE_URL` only if query logging is wanted.
