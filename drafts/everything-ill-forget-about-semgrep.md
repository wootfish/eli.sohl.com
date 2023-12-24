[[[TOC]]]

# Invocation

Semgrep rules can be provided ad-hoc on the command line:

$ semgrep -e "Crypto.Cipher.AES" -l py

The `-l` or `--lang` argument is required, but `generic` is a valid option; that said, it's best to be specific so semgrep can use the best available parser.

TKTK run a rule or suite of rules
TKTK check a semgrep rule against the semgrep rule rules

# Rule format

A trivial rule should follow this skeleton:

```
rules:
- id: kebab-case-name
  message: Don't do this. Do something else.
  languages: [py]
  severity: WARNING
  pattern: exit(1)
```

This is a nice starting point. Some notes:

 * The file starts with `rules` because each config file can contain multiple rules. We include this top-level key even if we're only writing one rule.
 * The `id` should be unique. If you have similar rules for multiple languages, it may make sense to include the language in each ID.
 * The `message` will be shown next to a code snippet, and should provide commentary on its neighbor rather than rehashing it. The semgrep docs give [further guidance on messages.](https://semgrep.dev/docs/contributing/contributing-to-semgrep-rules-repository/#rule-messages)
 * The `languages` key can be a single language. The abbreviations can be found [here](https://semgrep.dev/docs/writing-rules/rule-syntax/#language-extensions-and-languages-key-values).
 * The `severity` can be INFO, WARNING, or ERROR. Findings can be filtered by severity.
 * The `pattern` must follow the [pattern syntax](https://semgrep.dev/docs/writing-rules/pattern-syntax/). Technically instead of `pattern` you could also use `patterns`, `pattern-either`, or `pattern-regex` here.

These fields are enough to get Semgrep to run. If we want to share our rules on the Semgrep Registry, [we need to add some more fields](https://semgrep.dev/docs/contributing/contributing-to-semgrep-rules-repository/#semgrep-registry-rule-requirements). In particular, the rule must provide some `metadata`, including a `category`. If this is `category: security`, then there are [additional requirements](https://cwe.mitre.org/data/definitions/420.html).

The following is a minimal example of a rule that meets all these criteria.

```
rules:
- id: kebab-case-name
  metadata:
    category: security
    subcategory: vuln
    technology:
    - kubernetes
    cwe:
    - 'CWE-420: Unprotected Alternate Channel'
    references:
    - https://cwe.mitre.org/data/definitions/420.html
    confidence: LOW
    likelihood: MEDIUM
    impact: HIGH
  message: Don't do this. Do something else.
  languages: [py]
  severity: WARNING
  pattern: exit(1)
```
That's great.

If you're wondering, the other categories besides `security` are `best-practice`, `correctness`, `maintainability`, `performance`, and `portability`.

For `subcategory`, the valid values are `vuln`, `audit`, or `guardrail`. The first is self-explanatory, the second is for finding "areas of interest" to auditors (e.g. all calls to `database.exec(...)`), the third is for "in-house" rules.

The `technology` field can be `django`, `docker`, `express`, `kubernetes`, `nginx`, `react`, `terraform`, and `--no-technology--`. This seems a bit reductive to me, but OK.

They do require a `cwe`. TKTK SUGGEST SOME COMMON ONES

It might sound like `confidence` and `likelihood` are redundant; in fact, the latter refers to exploitability ("likelihood of exploitation"). The former reflects the rule's ratio of true positives to false positives.

This format is nontrivial, but it comes with a checker: you can use Semgrep itself to check and fix your rules by running them against signatures from the Semgrep Registry under [the YAML tag](https://semgrep.dev/r?q=meta&lang=YAML).

TKTK give cli tutorial for checking against these rules; re this, how do we run 'jobs'? "The semgrep-rule-lints job runs linters on a new rule to check for mistakes"

# Basic patterns

TKTK simple patterns, eg enumerating api calls (with symbolic propagation)

TKTK pattern chaining & filtering, eg zeroization pattern

TKTK nested scopes, eg more of zeroization pattern

TKTK metavariables, metavariable regexes, focus-metavariable

TKTK structural matching

# Flow analysis

TKTK taint tracking, eg key logger example, plus multi-src-multi-sink variant

TKTK note alternative to flow analysis as in eg ./community/contrib/nodejsscan/crypto_timing_attacks.js
    this is not intuitive - it immediately seems worse but i bet it runs faster? is it less reliable?
    if this is equally reliable then it's clearly superior to flow analysis; the only exception would
    be when sanitizers are needed

# Pattern design

TKTK Don't give too much commentary above; save it for here. Move stuff here as needed.

Catch-all rules vs specialized cases (I prefer catch-all).

Prefer prefixing the ids for api usage checks like lang-api-then-rule-name to keep ids unique for related signatures

# Specialized patterns

TKTK are there any templating type features? eg suppose we want a generic rule for "check zeroization" but we don't know what the zeroization macro will be a priori, can we provide that at runtime somehow? or have a simple way of forking a general rule into specialized versions? maybe you just copy paste i guess but that seems suboptimal, it makes updating rules more of a hassle


