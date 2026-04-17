import { z } from "zod";

export const techStackSchema = z.object({
  language: z.string().min(1, "Required"),
  framework: z.string().optional().or(z.literal("")),
  database: z.string().optional().or(z.literal("")),
  extras: z.array(z.string()).default([]),
});

export const conventionSchema = z.object({
  rule: z.string().min(1),
  rationale: z.string().optional().or(z.literal("")),
});

export const commandSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  body: z.string().min(1),
  allowed_tools: z.array(z.string()).optional(),
});

// --- Beginner ---
export const beginnerSchema = z.object({
  project_name: z.string().min(1).max(80),
  one_liner: z.string().min(1).max(200),
  tech_stack: techStackSchema,
  run_command: z.string().min(1),
  conventions: z.array(conventionSchema).default([]),
});
export type BeginnerInput = z.infer<typeof beginnerSchema>;

// --- Intermediate ---
export const architectureSchema = z.object({
  summary: z.string().min(1),
  key_directories: z.record(z.string(), z.string()).default({}),
});

export const intermediateSchema = z.object({
  project_name: z.string().min(1).max(80),
  one_liner: z.string().min(1).max(200),
  tech_stack: techStackSchema,
  architecture: architectureSchema,
  run_command: z.string().min(1),
  test_command: z.string().optional().or(z.literal("")),
  conventions: z.array(conventionSchema).default([]),
  commands: z.array(commandSchema).default([]),
  allowed_tools: z.array(z.string()).default(["Read", "Edit", "Bash", "Glob", "Grep"]),
});
export type IntermediateInput = z.infer<typeof intermediateSchema>;

// --- Expert ---
export const crossCuttingRuleSchema = z.object({
  category: z.string().min(1),
  rule: z.string().min(1),
  rationale: z.string().optional().or(z.literal("")),
});

export const skillSchema = z.object({
  name: z.string().regex(/^[a-z0-9-]+$/, "kebab-case only"),
  description: z.string().min(20).max(500),
  body: z.string().min(1),
});

export const agentSchema = z.object({
  name: z.string().regex(/^[a-z0-9-]+$/, "kebab-case only"),
  description: z.string().min(1),
  tools: z.array(z.string()).default([]),
  model: z.string().optional().or(z.literal("")),
  system_prompt: z.string().min(1),
});

export const hookSchema = z.object({
  event: z.string().min(1),
  matcher: z.string().optional().or(z.literal("")),
  command: z.string().min(1),
});

export const mcpServerSchema = z.object({
  name: z.string().regex(/^[a-z0-9_-]+$/),
  type: z.string().default("stdio"),
  command: z.string().optional().or(z.literal("")),
  args: z.array(z.string()).default([]),
  url: z.string().optional().or(z.literal("")),
  env: z.record(z.string(), z.string()).default({}),
});

export const expertSchema = z.object({
  project_name: z.string().min(1).max(80),
  one_liner: z.string().min(1).max(200),
  tech_stack: techStackSchema,
  architecture: architectureSchema,
  run_command: z.string().min(1),
  test_command: z.string().optional().or(z.literal("")),
  build_command: z.string().optional().or(z.literal("")),
  conventions: z.array(conventionSchema).default([]),
  cross_cutting_rules: z.array(crossCuttingRuleSchema).default([]),
  commands: z.array(commandSchema).default([]),
  skills: z.array(skillSchema).default([]),
  agents: z.array(agentSchema).default([]),
  hooks: z.array(hookSchema).default([]),
  mcp_servers: z.array(mcpServerSchema).default([]),
  include_memory_md: z.boolean().default(true),
  allowed_tools: z
    .array(z.string())
    .default(["Read", "Edit", "Write", "Bash", "Glob", "Grep", "WebFetch"]),
  denied_tools: z.array(z.string()).default([]),
});
export type ExpertInput = z.infer<typeof expertSchema>;
