# Research

Working files for the Architecture agent's research output. Three
buckets:

| Subdir | Content |
|---|---|
| `tools/<tool>.md` | Evaluation of a tool, MCP server, library, or service |
| `patterns/<pattern>.md` | Workflow pattern research (what are other agentic teams doing? what's the right shape?) |
| `replications/<paid-service>.md` | Free-replication case studies (paid → free path documented) |

## Tool evaluation template (`tools/<tool>.md`)

```markdown
---
tool: <name>
type: <mcp | library | service | scheduled-task>
free_tier: <yes | no | limited>
researched_at: <ISO-8601>
status: <considering | adopted | rejected>
---

## Capability
## Free alternatives
## Cost (if any)
## Integration burden
## Maintenance burden
## Recommendation
## Sources
```

## Pattern research template (`patterns/<pattern>.md`)

```markdown
---
pattern: <name>
domain: <coordination | testing | monitoring | observability | ...>
researched_at: <ISO-8601>
---

## Pattern description
## Where it shows up (community examples with links)
## Variants
## Pros / cons
## Applicability to PARBAUGHS
## Sources
```

## Replication case study template (`replications/<paid-service>.md`)

The most important sub-bucket. Every paid service this project ever
considered AND its free path lives here. Future replications start by
reading these.

```markdown
---
paid_service: <name + vendor>
paid_cost: <$/month or per-use>
free_replacement: <name + path>
status: <replicated | in-progress | researching | rejected>
replicated_at: <ISO-8601>
---

## The paid service offered
## The free path
## Capability gap
## Implementation cost (one-time + ongoing)
## Maintenance burden
## Outcome (if replicated)
## Sources + community references
```

## Seeded case studies

Day-1 seed includes 5 case studies for paid services this project
already has free paths for:

- `replications/zai-vision-mcp.md` — Read-tool built-in vision
- `replications/applitools-visual-testing.md` — Playwright MCP + diff scripts
- `replications/composio-design-review-loop.md` — design-bot via Playwright
- `replications/linear-jira.md` — task-queue/ pattern (AMD-022)
- `replications/datadog-newrelic.md` — custom cron + sidecar + banners

These are deliberately written first so the architecture agent inherits
them and uses them as patterns for future evaluations.
