[[[TOC]]]

# Ten-Second Primer

Semgrep is a static code analysis tool. It works on [any language it can parse](TKTK ADD LINKS). Compilation is not required. Rules are terse and flexible. There is limited support for data flow analysis. There is a paid version. The free version works well, but has limitations; most notably it can't track patterns across files. Semgrep can run completely offline, however it does not do so by default.

Semgrep is installed with `python3 -m pip install semgrep` and is invoked as follows.

# Invocation

For quick searches, Semgrep rules can be provided ad-hoc on the command line:

$ semgrep -e "Crypto.Cipher.AES" -l py

This will locate uses of the `Crypto.Cipher` library's AES object, even if it is used under a different name. This sort of ad-hoc query can be useful for navigating unfamiliar codebases.

The `-l` or `--lang` argument is required, but `generic` is a valid option; that said, it's best to be specific so semgrep can use the best available parser.

The most common invocation will see you running a suite of Semgrep rules. If this is stored locally, you pass the path to `-c` or `--config`, like so:

$ semgrep -c ~/semgrep-rules/

You can pass multiple `--config` arguments to include multiple rulesets in a scan.

For rulesets on the semgrep registry, you prefix their name with "p/". For example,

$ semgrep -c p/rust

will run a scan using the rules from [https://semgrep.dev/p/rust](https://semgrep.dev/p/rust).

For checking your own Semgrep rules against the checks in Semgrep's own Semgrep rule ruleset, use:

$ semgrep -c p/semgrep-rule-lints


# Rule format

Trivial rules resemble this skeleton:

```
rules:
- id: kebab-case-name
  message: Don't do this. Do something else.
  languages: [py]
  severity: WARNING
  pattern: exit(1)
```

This is a nice starting point. Some notes:

 * The file starts with `rules` because each config file can contain multiple rules. We include this top-level YAML key even if we're only writing one rule.
 * The `id` should be unique. If you have similar rules for multiple languages, it may make sense to include the language in each ID.
 * The `message` will be shown next to a code snippet, and should provide commentary on its neighbor rather than rehashing it. The semgrep docs give [further guidance on messages.](https://semgrep.dev/docs/contributing/contributing-to-semgrep-rules-repository/#rule-messages)
 * The `languages` key can be a single language. The abbreviations can be found [here](https://semgrep.dev/docs/writing-rules/rule-syntax/#language-extensions-and-languages-key-values).
 * The `severity` can be INFO, WARNING, or ERROR. Findings can be filtered by severity.
 * The `pattern` must follow the [pattern syntax](https://semgrep.dev/docs/writing-rules/pattern-syntax/). Technically instead of `pattern` you could also use `patterns`, `pattern-either`, or `pattern-regex` here.

These fields are enough to get Semgrep to run. If we want to share our rules on the Semgrep Registry, [we need to add some more fields](https://semgrep.dev/docs/contributing/contributing-to-semgrep-rules-repository/#semgrep-registry-rule-requirements). In particular, the rule must provide some `metadata`, including a `category`. If this is `category: security`, then there are [even more requirements](https://cwe.mitre.org/data/definitions/420.html).

The following is a minimal example of a rule that meets all the `security`-level criteria.

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
  pattern: ...
```

That's great.

If you're wondering, the other categories besides `security` are `best-practice`, `correctness`, `maintainability`, `performance`, and `portability`.

For `subcategory`, the valid values are `vuln`, `audit`, or `guardrail`. The first is self-explanatory, the second is for finding "areas of interest" to auditors (e.g. all calls to `database.exec(...)`), the third is for "in-house" rules.

The `technology` field can be `django`, `docker`, `express`, `kubernetes`, `nginx`, `react`, `terraform`, and `--no-technology--`. This seems a bit reductive to me, but OK.

They do require a `cwe` key. There are many CWEs and you can browse them [here](https://cwe.mitre.org/data/index.html). I've included a list of some common CWEs below.

It might sound like `confidence` and `likelihood` are redundant; in fact, the latter refers to exploitability ("likelihood of exploitation"). The former reflects the rule's ratio of true positives to false positives.

This format is nontrivial, but at least you can check your work with `semgrep -c p/semgrep-rule-lints`. This uses the default Semgrep-curated list of rules for Semgrep rules. If you want to go further, there are more signatures available the Semgrep Registry under [the YAML tag](https://semgrep.dev/r?q=meta&lang=YAML).

# Basic patterns

## Finding API calls

As mentioned, a basic ad-hoc query for AES usage might look like this:

$ semgrep -e "Crypto.Cipher.AES" -l py

We can codify this into a (minimal) rule like so:

```yaml
rules:
  - id: pycryptodome-aes-usage
    languages:
      - python
    otions:
      - symbolic_propagation: true
    pattern: Crypto.Cipher.AES.new(...)
    message: An AES cipher is instantiated here.
    severity: INFO
```

Of course, this rule is just as likely to trigger for secure code as insecure code. This is not a signature for a vulnerability, but for an auditor interested in cryptographic functionality this provides a quick way of identifying areas which deserve further attention.

The `symbolic_propagation` option is nonobvious but recommended. Without it, this rule would fail to match usages where `Crypto.Cipher.AES` was bound to a new symbol and then `new()` was called on that symbol. For more details, see the discussion below.

## Chaining and filtering

A rule can use a single pattern, or it can be multiple patterns. Patterns can be positive (e.g. `pattern`) or negative (e.g. `pattern-not`, `pattern-not-inside`). Each positive pattern will produce possible matches; each negative pattern will filter out unwanted matches. By chaining them, you can create expressive rules. For example, here's a pattern for checking Windows kernel code; this signature checks for zeroization of buffers which have been used to store decrypted plaintexts.

rules:
  - id: bcrypt-no-zeroize-pt-block
    languages:
      - cpp
    patterns:
      - pattern: BCryptDecrypt($HKEY, $PBINPUT, $CBINPUT, $PPADDINGINFO, $PBIV, $CBIV, $PBOUTPUT, $CBOUTPUT, $PCBRESULT, $DWFLAGS);
      - pattern-not-inside: |
        ...
        SecureZeroMemory($PBOUTPUT, sizeof($PBOUTPUT));
    message: $PBOUTPUT may be sensitive and does not appear to be zeroized after use.
    severity: INFO

This rule starts by matching on _every_ invocation of `BCryptDecrypt` (documented [here](https://learn.microsoft.com/en-us/windows/win32/api/bcrypt/nf-bcrypt-bcryptdecrypt)). Then, for each match, it checks whether that match is contained within the second pattern, which looks for a call to SecureZeroMemory (documented [here](https://learn.microsoft.com/en-us/previous-versions/windows/desktop/legacy/aa366877(v=vs.85))).
Metavariables, once defined, can be used in subsequent patterns; their values will persist. For example, `$PBOUTPUT`, defined in the first pattern, is referenced in the second pattern.

This rule will report a finding if and only if the first pattern matches and the second pattern fails to match.

As an aside, it is worth noting that informed opinions differ regarding the *importance* of sanitizing memory, however it is nevertheless considered a best practice, even if only as a defense-in-depth measure.

This rule demonstrates a general pattern where we search first for an action, and then for a corresponding cleanup action. Care must be taken if it is possible that these actions could take place in separate code blocks. The rule above handles this case correctly: `BCryptDecrypt` and `SecureZeroMemory` do not need to be called from the same block. However, it is easy to write rules that behave differently; for example, [this](https://semgrep.dev/playground/s/DJ6G) pattern from the Semgrep documentation will only work when `open()` and `close()` are called within the same code block, and it will fail if (say) `open()` is called within a loop, or within each branch of an if/then. This is discussed further below; for now, let's just say that attention to detail is important here, as are comprehensive test cases.

## Metavariables, metavariable regexes, focus-metavariable

The zeroization pattern above used a number of metavariables. These are flexible placeholders. TKTK do they work like ...? If so then say that.

Metavariables, once bound, can be checked against [patterns](https://semgrep.dev/docs/writing-rules/rule-syntax/#metavariable-pattern) or [regexes](https://semgrep.dev/docs/writing-rules/rule-syntax/#metavariable-regex). Here is a [community-sourced](https://github.com/semgrep/semgrep-rules/blob/release/dockerfile/security/secret-in-build-arg.yaml) example of a rule that looks for secrets in Dockerfiles by checking metavariables against a list of keywords:

```yaml
rules:
- id: secret-in-build-arg
  patterns:
  - pattern-either:
    - pattern: ARG $ARG
    - pattern: ARG $ARG=...
  - metavariable-regex:
      metavariable: $ARG
      regex: (?i).*(password|secret|token|key|cert|api|auth)
  message: >-
    Docker build time arguments are not suited for secrets, because the
    argument values are saved with the image. Running `docker image history` on the
    image will show information on how the image was built, including arguments. If
    these contain plain text secrets, anyone with access to the docker image can access
    those secrets and exploit them.
  metadata:
    category: security
    technology:
    - dockerfile
    cwe:
    - 'CWE-538: Insertion of Sensitive Information into Externally-Accessible File or Directory'
    owasp:
    - A01:2021 - Broken Access Control
    references:
    - https://cwe.mitre.org/data/definitions/538.html
    - https://docs.docker.com/engine/reference/builder/#arg
    subcategory:
      - audit
    likelihood: LOW
    impact: HIGH
    confidence: LOW
  languages:
    - dockerfile
  severity: WARNING
```


## TKTK structural matching

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

# CWE reference

Security-related rules in the Semgrep Registry require a CWE category. Again, the full list of CWEs, along with some specialized views, can be found [at MITRE's web site](https://cwe.mitre.org/data/index.html). For convenience, I've included the following list of the 25 most common CWEs in Semgrep's community rule collection, in descending order:

https://cwe.mitre.org/data/definitions/79.html


 * [CWE-798](https://cwe.mitre.org/data/definitions/798.html): Use of Hard-coded Credentials
 * [CWE-79](https://cwe.mitre.org/data/definitions/79.html): Improper Neutralization of Input During Web Page Generation ('Cross-site Scripting')
 * [CWE-284](https://cwe.mitre.org/data/definitions/284.html): Improper Access Control
 * [CWE-89](https://cwe.mitre.org/data/definitions/89.html): Improper Neutralization of Special Elements used in an SQL Command ('SQL Injection')
 * [CWE-319](https://cwe.mitre.org/data/definitions/319.html): Cleartext Transmission of Sensitive Information
 * [CWE-94](https://cwe.mitre.org/data/definitions/94.html): Improper Control of Generation of Code ('Code Injection')
 * [CWE-327](https://cwe.mitre.org/data/definitions/327.html): Use of a Broken or Risky Cryptographic Algorithm
 * [CWE-78](https://cwe.mitre.org/data/definitions/78.html): Improper Neutralization of Special Elements used in an OS Command ('OS Command Injection')
 * [CWE-918](https://cwe.mitre.org/data/definitions/918.html): Server-Side Request Forgery (SSRF)
 * [CWE-320](https://cwe.mitre.org/data/definitions/320.html): CWE CATEGORY: Key Management Errors
 * [CWE-502](https://cwe.mitre.org/data/definitions/502.html): Deserialization of Untrusted Data
 * [CWE-326](https://cwe.mitre.org/data/definitions/326.html): Inadequate Encryption Strength
 * [CWE-611](https://cwe.mitre.org/data/definitions/611.html): Improper Restriction of XML External Entity Reference
 * [CWE-95](https://cwe.mitre.org/data/definitions/95.html): Improper Neutralization of Directives in Dynamically Evaluated Code ('Eval Injection')
 * [CWE-22](https://cwe.mitre.org/data/definitions/22.html): Improper Limitation of a Pathname to a Restricted Directory ('Path Traversal')
 * [CWE-522](https://cwe.mitre.org/data/definitions/522.html): Insufficiently Protected Credentials
 * [CWE-311](https://cwe.mitre.org/data/definitions/311.html): Missing Encryption of Sensitive Data
 * [CWE-706](https://cwe.mitre.org/data/definitions/706.html): Use of Incorrectly-Resolved Name or Reference
 * [CWE-200](https://cwe.mitre.org/data/definitions/200.html): Exposure of Sensitive Information to an Unauthorized Actor
 * [CWE-352](https://cwe.mitre.org/data/definitions/352.html): Cross-Site Request Forgery (CSRF)
 * [CWE-601](https://cwe.mitre.org/data/definitions/601.html): URL Redirection to Untrusted Site ('Open Redirect')
 * [CWE-915](https://cwe.mitre.org/data/definitions/915.html): Improperly Controlled Modification of Dynamically-Determined Object Attributes
 * [CWE-732](https://cwe.mitre.org/data/definitions/732.html): Incorrect Permission Assignment for Critical Resource
 * [CWE-250](https://cwe.mitre.org/data/definitions/250.html): Execution with Unnecessary Privileges
 * [CWE-614](https://cwe.mitre.org/data/definitions/614.html): Sensitive Cookie in HTTPS Session Without 'Secure' Attribute

 While CWEs are required, the rules around them do not appear to be too strict, as evidenced by the presence of "CWE-320: CWE CATEGORY: Key Management Errors" in the #10 spot despite MITRE's guidance that, as a category, "this CWE ID must not be used to map to real-world vulnerabilities".


