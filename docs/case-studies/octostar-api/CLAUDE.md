# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Before writing or reviewing code, read [`LESSONS.md`](LESSONS.md)** -- hard-won engineering lessons from real bugs and PR reviews.

**When reviewing code, also read the nearest `.cursor/BUGBOT.md`** in the directory hierarchy of the files being reviewed — these contain scoped review rules for specific areas of the codebase.

## Commands

### Development Setup
```bash
# Install dependencies and setup pre-commit hooks
uv sync && uv run pre-commit install

# Run development server
fastapi dev app/main.py [--port YOUR_PORT]

# Connect to backend services (requires SSH and kubefwd)
scripts/octostar-backend.sh [ENVIRONMENT]  # ci, demo1, demo2, demo3
scripts/octostar-backend.sh clean-hosts    # Clean DNS issues
```

### Code Quality
```bash
# Format code (required before commits)
uv run black app/

# Type checking
./scripts/typecheck.sh              # Full codebase
./scripts/typecheck-staged.sh       # Staged files only
```

### Testing
```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run with coverage
pytest --cov=app

# Run specific test
pytest tests/test_module.py::test_function
```

## Architecture

### Feature-Based Organization
The codebase follows a feature-based architecture. Each feature in `app/api/v1/` contains:
- `model.py`: Data models and schemas
- `service.py`: Business logic and database operations
- `router.py`: FastAPI endpoints

Example structure:
```
app/api/v1/entities/
├── model.py      # Entity schemas
├── service.py    # Entity business logic
└── router.py     # Entity API endpoints
```

### Common Code
Shared functionality lives in `app/api/v1/common/`:
- `adapters/db/`: Database adapters supporting MySQL, ClickHouse, SQLite
- `services/`: Core services (Timbr data virtualization, S3, OpenSearch)
- `dependencies/`: Auth and permission dependencies
- `utils/`: Utilities for crypto, K8s operations, etc.

### Key Architectural Patterns

1. **Service Layer Pattern**: All business logic goes in service modules, routers only handle HTTP concerns
2. **Dependency Injection**: FastAPI dependencies for auth, permissions, and database connections
3. **Async-First**: All database operations and external API calls are async
4. **Database Adapter Pattern**: Abstract database operations to support multiple backends

### AI Integration
The AI chat system (`app/api/v1/ai/`) uses LangChain with:
- Multiple agents (OpenAI, mock for testing)
- RAG implementation with OpenSearch
- Agentic workflows with tools for code analysis and GitHub operations
- Multi-graph processing for complex queries

### Important Services

1. **Timbr Service** (`timbr_service.py`): Primary data virtualization layer via the Timbr HTTP API, with ClickHouse for translated SQL execution (JDBC path retired)
2. **OpenSearch Service**: Powers search and RAG functionality
3. **K8s Service** (`kubernetes_utils.py`): Manages app deployments and pod operations
4. **Settings Service**: Hot-reloads configuration from mounted secrets

### Database Schema
- Uses Alembic for migrations
- Core models in `app/core/`
- Metadata stored in MySQL
- Data queries through Timbr (HTTP) and ClickHouse per routing
- Search data in OpenSearch

### Testing Approach
- Pytest with async support via `pytest-asyncio`
- Mock external dependencies (use `unittest.mock`)
- Test files mirror source structure in `tests/`
- Use fixtures for common test data

### Environment Configuration
- Environment overlays in `env_overlays/`
- Settings hot-reload from `/app/api-mount/secrets/`
- Environment variables prefixed with `OCTOSTAR_`

### Deployment
- Kubernetes via Helm chart in `helm/`
- Docker image is Python-based (no JVM for Timbr)
- Runs as non-root user `octostar`
- Multi-worker uvicorn setup

### ClickUp Integration
Project management is tracked in ClickUp. Use the API to add comments or update tasks.

- **Team ID**: `24535548`
- **API key**: stored in `~/.clickup-api-key` (never commit this)
- **Custom ID prefix**: `TEAM-` (e.g., `TEAM-2140`)

```bash
# Look up a task by custom ID
curl -s "https://api.clickup.com/api/v2/task/TEAM-XXXX?custom_task_ids=true&team_id=24535548" \
  -H "Authorization: $(cat ~/.clickup-api-key)"

# Add a comment to a task (use internal task ID from lookup above)
curl -s -X POST "https://api.clickup.com/api/v2/task/{TASK_ID}/comment" \
  -H "Authorization: $(cat ~/.clickup-api-key)" \
  -H "Content-Type: application/json" \
  --data-raw '{"comment_text":"Your comment here"}'
```

### PR Preview Deployments
Each PR gets a live preview deployment in the `pr` Kubernetes namespace.

- **URL pattern**: `https://api-pr-{NUMBER}.main.octostar.com/`
- **Deployment name**: `octostar-api-pr-{NUMBER}` in namespace `pr`

To inspect PR preview pod logs (using kubectl from your local machine):
```bash
# Ensure your kubeconfig is configured for the cluster
# List PR pods in the pr namespace
kubectl get pods -n pr | grep octostar-api-pr-{NUMBER}

# Tail logs for the PR deployment
kubectl logs -n pr deployment/octostar-api-pr-{NUMBER} --tail=200 --follow

# Describe the deployment for more details
kubectl describe deployment -n pr octostar-api-pr-{NUMBER}
```
