#!/usr/bin/env node
import { Command } from "commander";

import { add } from "./commands/add.js";
import { dashboard } from "./commands/dashboard.js";
import { doctor } from "./commands/doctor.js";
import { down } from "./commands/down.js";
import { generate } from "./commands/generate.js";
import { init } from "./commands/init.js";
import { up } from "./commands/up.js";
import { validate } from "./commands/validate.js";

const program = new Command();

program
  .name("eventpilot")
  .description("Scaffold and run an event-driven architecture in one command.")
  .version("0.0.1");

program
  .command("init")
  .description("Create eventpilot.yaml, docker-compose.yml and base service code")
  .option("--force", "overwrite an existing project")
  .action(init);

program
  .command("doctor")
  .description("Check Node, Docker and the Docker daemon are ready")
  .action(doctor);

program
  .command("generate")
  .description("Regenerate files from eventpilot.yaml (idempotent)")
  .option("--force", "overwrite manually edited generated files")
  .action(generate);

program.command("validate").description("Validate eventpilot.yaml").action(validate);

program.command("up").description("Start the local Docker infrastructure").action(up);

program.command("down").description("Stop the local Docker infrastructure").action(down);

program.command("dashboard").description("Open the local dashboard").action(dashboard);

program
  .command("add <feature>")
  .description("Add a feature (dlq, outbox, metrics, replay) to an existing project")
  .option("--force", "overwrite manually edited generated files")
  .action(add);

await program.parseAsync(process.argv);
