/**
 * PawHaven Harness — Pi runtime bridge.
 *
 * This is the ONLY runtime-specific artifact besides `.pi/settings.json`. It does
 * not own any harness content. It only wires the canonical `harness-core` source
 * into the Pi runtime:
 *
 *   - skills  -> declared directly in settings.json (`harness-core/plugins`)
 *   - prompts -> declared directly in settings.json (`harness-core/workflows`)
 *   - agents  -> projected one-directionally into `.pi/agents` by the harness
 *                sync script (Pi discovers agents only from `.pi/agents/*.md`)
 *   - rules   -> injected here as runtime system-prompt context, so the
 *                canonical `harness-core/rules` stay the single source of truth
 *                and are never copied into a prompt tree.
 *
 * No skill, workflow, rule, or agent markdown is duplicated here.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";

const baseDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(baseDir, "..", "..");

const RULES_DIR = path.join(projectRoot, "harness-core", "rules");

function loadRules(): string {
  if (!fs.existsSync(RULES_DIR)) return "";
  const files = fs
    .readdirSync(RULES_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort();
  if (files.length === 0) return "";

  const sections = files.map((file) => {
    const name = file.replace(/\.md$/, "");
    const body = fs.readFileSync(path.join(RULES_DIR, file), "utf-8").trim();
    return `### ${name}\n\n${body}`;
  });

  return `

## PawHaven Harness Rules (canonical: harness-core/rules)

The following invariant rules are loaded directly from \`harness-core/rules\`. They are
runtime context, not editable prompts — treat them as binding.

${sections.join("\n\n")}
`;
}

export default function harnessBridge(pi: ExtensionAPI) {
  pi.on("before_agent_start", async (event) => {
    const rules = loadRules();
    if (!rules) return;
    return {
      systemPrompt: event.systemPrompt + rules,
    };
  });
}
