#!/usr/bin/env node

// Usage:
//   node scripts/validate-config.js --schema samples/schemas/schema.v2.json --config samples/configs/config.v2.good.json
// Exit codes:
//   0 ok
//   2 invalid
//   3 usage error

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] || null;
}

const schemaPath = argValue('--schema');
const configPath = argValue('--config');

if (!schemaPath || !configPath) {
  console.error('Usage: node scripts/validate-config.js --schema <schema.json> --config <config.json>');
  process.exitCode = 3;
  process.exit();
}

const schema = JSON.parse(fs.readFileSync(path.resolve(schemaPath), 'utf8'));
const config = JSON.parse(fs.readFileSync(path.resolve(configPath), 'utf8'));

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

const validate = ajv.compile(schema);
const ok = validate(config);

if (!ok) {
  console.error('Invalid configuration:');
  for (const e of validate.errors || []) {
    console.error(`- ${e.instancePath || '(root)'}: ${e.message}`);
  }
  process.exitCode = 2;
  process.exit();
}

console.log('OK: configuration is valid');

