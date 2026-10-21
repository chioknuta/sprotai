# .codex

Config for running the Codex CLI on this project. The instructions it reads are
in [AGENTS.md](../AGENTS.md), which is a pointer to
[CLAUDE.md](../CLAUDE.md) — there is one copy of the rules, deliberately.

## Two things to know

**The hook path is project-root relative.** It was written as an absolute path
into one particular home directory, which is no use to anyone else and does not
belong in a public repo. It is now `./.codex/hooks/context-nudge.sh`. If the
nudge stops firing, it is because
Codex runs hooks from somewhere other than the project root; make the path
absolute again **locally** and don't commit that.

**`hooks/context-nudge.sh` is byte-identical to `.claude/hooks/context-nudge.sh`.**
Two copies of the same script will drift, and the only reason there are two is
that each CLI looks in its own directory. Nothing breaks if they diverge — it
is a convenience nudge about when to clear the context window — but if you
touch one, touch the other. The equivalent duplication in `AGENTS.md` had
already gone wrong before anyone noticed, which is why that one is now a
pointer.
