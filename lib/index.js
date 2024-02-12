import * as core from "@actions/core";
import { action } from "./action.js";

try {
  await action({
    html: core.getInput("html", { required: true }),
    selector: core.getInput("selector", { required: true }),
    mode: core.getInput("mode"),
    parentSelector: core.getInput("parent-selector") || null,
  });
} catch (error) {
  core.setFailed(
    error instanceof Error ? error.message : "An unknown error occurred"
  );
}
