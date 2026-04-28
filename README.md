## Configuration Management System with Validation

Full-stack backend project using **Node.js (Express)**, **MongoDB (Mongoose)**, and **JSON Schema validation (AJV)**.

### Features

- **Upload config**: `POST /config`
- **Validate before saving** using JSON Schema (AJV)
- **MongoDB storage with versioning**: `v1, v2, ...` (numeric versions)
- **Fetch latest/active config**: `GET /config/latest`
- **Rollback**: `POST /config/rollback` (sets active pointer to previous version)
- **Schema versions + migrations**:
  - Store schemas in MongoDB (`/schema`)
  - Built-in example migration `v1_to_v2`
  - Uploading a `v1` config can auto-migrate to `v2` if migration path exists
- **Reject invalid configs** with AJV error details

### Security

- **API key auth** via `x-api-key` header
- **Unix file permissions**: exported config can be made **read-only (444)** on Linux/macOS (`scripts/export-latest-config.js`)

### Folder structure

- `src/`: API server (Express, Mongoose, AJV)
- `scripts/`: seed/validate/export utilities
- `samples/`: sample schemas + configs
- `ansible/`: basic deployment playbook

---

## Setup (local)

### 1) Prereqs

- Node.js 18+ (recommended: 20)
- MongoDB running locally, or a MongoDB URI

### 2) Install

```bash
npm install
```

### 3) Configure environment

Copy `.env.example` to `.env` and set values:

- `MONGODB_URI`
- `API_KEY`
- `DEFAULT_SCHEMA_VERSION` (defaults to `v1` if omitted)

Quick start (no MongoDB installed):

- Set `USE_IN_MEMORY_DB=true` in `.env` (and you can omit `MONGODB_URI`)

### 4) Seed schemas (v1 and v2)

```bash
npm run seed
```

### 5) Start server

```bash
npm run dev
```

Health check:

- `GET /health` (no auth)

---

## API usage

All endpoints below require header:

- `x-api-key: <your API_KEY>`

### Upload config (validated + versioned)

`POST /config`

Body:

```json
{
  "schemaVersion": "v2",
  "config": {
    "service": { "name": "billing", "port": 3000 },
    "features": { "flags": { "audit": true } }
  }
}
```

Notes:
- If you upload with `"schemaVersion": "v1"` and schemas include `v2` with `v1_to_v2`, the server will:
  - validate as `v1`
  - migrate to `v2`
  - validate as `v2`
  - store as `v2`

### Fetch latest active config

`GET /config/latest`

### Rollback to previous version

`POST /config/rollback`

---

## Schema registry

### List schemas

`GET /schema`

### Upload/update schema

`POST /schema`

```json
{
  "version": "v3",
  "jsonSchema": { "...": "..." },
  "previousVersion": "v2",
  "migrationKey": "v2_to_v3"
}
```

Important: `migrationKey` must reference a **trusted built-in** migration (no user-provided code execution).

---

## DevOps

### Validate config before deployment

```bash
chmod +x test-config.sh
./test-config.sh samples/schemas/schema.v2.json samples/configs/config.v2.good.json
```

### Export latest config to file (and make read-only on Unix)

```bash
npm run export:latest
```

Output file:
- `deploy/config.json` (chmod `444` on Unix)

---

## Git version control instructions (recommended)

### Initialize git + commit history

```bash
git init
git add .
git commit -m "Initial Configuration Management System"
```

### Maintain commit history for config changes

Recommended pattern:

- Store production candidate configs in a repo folder (example: `deploy/config.json` or `configs/prod.json`)
- Commit each change with a message like:
  - `git commit -am "Update billing flags for audit/export"`

You can also export config and commit it:

```bash
npm run export:latest
git add deploy/config.json
git commit -m "Export active config version"
```

---

## Ansible deploy (basic)

Edit:
- `ansible/inventory.ini`

Then run:

```bash
ansible-playbook -i ansible/inventory.ini ansible/deploy.yml
```

Notes:
- Put your `.env` on the server at `/opt/config-mgmt/.env`
- Ensure firewall allows `PORT` (default 3000) or proxy via Nginx
this is my first contribution

