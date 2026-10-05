# Module inventory

The modules that exist today, so a new key can be placed in the module that already owns the feature instead of starting a competing one. Counts are leaf key paths per module, taken from the tree on 2026-09-27; treat them as an indication of size, not a contract.

## App modules

| File                | Top-level key  | Leaves | Owns                                                                                                                                                          |
| ------------------- | -------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `common.json`       | `common`       | 52     | Strings used by more than one feature — `cancel`, `name`, `setting`, `brand`, `record`, `stories`, `owner_text`                                               |
| `reportAnimal.json` | `reportAnimal` | 121    | The stray reporting form — animal type, appearance, coat colour, injury, location                                                                             |
| `auth.json`         | `auth`         | 33     | Login, registration, logout — `login`, `sighup`, `login_subtitle`, `register_subtitle`, `security_notice`                                                     |
| `rescueDetail.json` | `rescueDetail` | 32     | A single rescue case page — `not_found`, `has_injury`, `case_id`, `animal_count`, `coat_color`                                                                |
| `rescueCases.json`  | `rescue_cases` | 28     | The rescue case list — `section_title`, `pending_count`, `in_progress_count`, `filter_all`, `view_list`, `view_map`, `no_cases_found`, per-animal-type labels |
| `rescueGuide.json`  | `rescueGuide`  | 25     | The guide library — hero copy, the downloadable-document list, and the guide steps array                                                                      |
| `errorMessage.json` | `errorMessage` | 22     | Error code to message mapping — `TOKEN_EXPIRED`, `INVALID_CREDENTIALS`, `PERMISSION_DENIED`, and 19 more                                                      |
| `footer.json`       | `footer`       | 31     | Site footer — link columns, brand description, and the closing CTA                                                                                            |
| `home.json`         | `home`         | 19     | Home page — hero, sections, and hero `aria` labels                                                                                                            |
| `animalFollow.json` | `animalFollow` | 8      | Follow and unfollow actions plus the follower-count plurals                                                                                                   |
| `imageUpload.json`  | `imageUpload`  | 6      | Upload limits and labels — `add`, `remove`, `count`, `too_many`, `format`, `size`                                                                             |
| `carousel.json`     | `carousel`     | 2      | Carousel controls — `previous`, `next`                                                                                                                        |

Total: 379 leaf keys per locale.

Two naming facts worth knowing before trusting an example: the reporting form was `reportStray` in older notes and is `reportAnimal` now, so a `t('reportStray.…')` path from an old example will not resolve; and `rescueCases.json` carries the top-level key `rescue_cases` while every other file name matches its key.

## Document modules

Printable and PDF text lives in a separate tree, `locales/<locale>/documents/<kind>/<name>.json`, loaded by its own i18next instance in `packages/i18n/resources.js` and keyed `document.<kind>.<name>.<key>`.

| File                                | Path                            |
| ----------------------------------- | ------------------------------- |
| `documents/pdf/header.json`         | `document.pdf.header.*`         |
| `documents/pdf/footer.json`         | `document.pdf.footer.*`         |
| `documents/pdf/firstAid.json`       | `document.pdf.firstAid.*`       |
| `documents/pdf/injuryResponse.json` | `document.pdf.injuryResponse.*` |
| `documents/pdf/kittenCare.json`     | `document.pdf.kittenCare.*`     |
| `documents/pdf/rescueGuide.json`    | `document.pdf.rescueGuide.*`    |

Each locale directory carries the same document sub-tree, and the backend PDF engine reads it through its own instance.
