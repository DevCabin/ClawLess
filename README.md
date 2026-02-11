# Clawless 🐾

**Self-hosted Open Source Alternative to OpenClaw**

Stop paying rent for agent infrastructure you should own.

Clawless is a production-grade personal agent runtime that intelligently routes between local (Ollama) and cloud (Claude) AI to optimize for cost and quality.

**Keywords**: self-hosted, open source, OpenClaw alternative, personal agent runtime, AI automation, hybrid intelligence, local AI, cost optimization

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)

---

## Features

✅ **Hybrid Intelligence**: Smart routing between Ollama (free) and Claude (paid)  
✅ **60%+ Cost Savings**: Most tasks handled by local AI  
✅ **Self-Hosted**: Your data, your infrastructure  
✅ **GitHub-Native**: Workflows stored as code  
✅ **Chat-First**: Build workflows in plain English  
✅ **Production-Ready**: Built for reliability  

---

## Quick Start

### Prerequisites

- Node.js 20+
- Git
- (Optional) Ollama installed locally
- Anthropic API key
- GitHub token

### Installation

```bash
# 1. Clone
git clone https://github.com/DevCabin/ClawLess
cd clawless

# 2. Install
npm install

# 3. Configure
cp .env.example .env
# Edit .env with your API keys

# 4. Start
npm run quickstart
```

The app will open at `http://localhost:3000` with a setup wizard.

---

## What Makes Clawless Different?

### Smart Model Routing

Clawless automatically routes tasks to the most cost-effective model:

- **Simple tasks** → Ollama (free)
- **Complex tasks** → Claude (paid)
- **Failed tasks** → Automatic fallback

**Example monthly savings:**
- Claude-only: $5/month
- Clawless: $1.50/month
- **Savings: 70%**

### Workflow as Code

Workflows are JSON files in your repo.

### Built for Developers

Not a black box SaaS. You can:
- Read the code
- Modify anything
- Add custom tools
- Deploy anywhere

---

## Documentation

- [Product Requirements](PRD.md) - Vision and features
- [Architecture](ARCHITECTURE.md) - System design
- [Implementation Plan](IMPLEMENTATION_PLAN.md) - Build guide
- [Intelligence Router Spec](SPEC_INTELLIGENCE_ROUTER.md) - Core routing logic
- [Coding Standards](.cursorrules) - Development guidelines

---

## Project Status

🚧 **In Development** - v0.1.0

Currently implementing Phase 0-2. See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) for details.

---

## Contributing

Contribution flow is being finalized. For now, see [HANDOFF.md](HANDOFF.md) for development guidance.

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Acknowledgments

Inspired by [OpenClaw](https://github.com/openclaw/openclaw) but built on principles of:
- Open source
- Self-hosting
- Cost optimization
- Developer control

If you’re part of the OpenClaw project, thank you for the inspiration — this project intentionally links back to your work.

---

**Built by George Featherstone at [DevCabin](https://github.com/DevCabin)**
