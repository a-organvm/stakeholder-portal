import { readFileSync } from "fs";
import { join } from "path";
import { parseManifest } from "../src/validation/manifest";

/**
 * Build-time validation script for manifest.json.
 * Fails the process if the manifest does not match the Zod-like schema.
 */
function validate() {
  const manifestPath = join(process.cwd(), "src/data/manifest.json");
  console.log(`Validating manifest at ${manifestPath}...`);

  try {
    const raw = readFileSync(manifestPath, "utf-8");
    const data = JSON.parse(raw);
    const parsed = parseManifest(data);
    
    console.log("✅ Manifest validated successfully.");
    console.log(`- Total Repos: ${parsed.system.total_repos}`);
    console.log(`- Organs: ${parsed.organs.length}`);
    console.log(`- Deployments: ${parsed.deployments.length}`);
  } catch (error) {
    console.error("❌ Manifest validation failed!");
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

validate();
