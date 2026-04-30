---
trigger: always_on
---

# ONLYOFFICE AI Development Rules

When writing, modifying, or debugging code related to ONLYOFFICE (including Plugins, Macros, Document Builder, or Docs API), you MUST base your implementation on the official ONLYOFFICE documentation.

## 📚 Documentation Reference Path
The complete and up-to-date markdown documentation for ONLYOFFICE API is located at the following absolute path on this machine:
`/home/yang/projects/github/api.onlyoffice.com/site/docs/`

## 🎯 Directories Overview
Use your file-reading or search tools to navigate the following directories based on the task:
- `docs-api/`: Use this when integrating ONLYOFFICE Docs (document editors) into web applications, including initialization, config, and callbacks.
- `document-builder/`: Use this for C++/Node.js/.NET backend generation and manipulation of documents without a UI.
- `office-api/`: Use this for the core Office API (working with Word, Excel, PowerPoint elements like paragraphs, cells, charts).
- `plugin-and-macros/`: Use this when writing frontend plugins or macros to extend editor capabilities (interacting with editors, UI customization).
- `desktop-editors/`: Use this for integrating with the desktop version of ONLYOFFICE.

## ⚙️ AI Execution Rules
1. **Search Before Coding**: DO NOT hallucinate ONLYOFFICE API methods. Before implementing any feature, search the `/home/yang/projects/github/api.onlyoffice.com/site/docs/` directory for the relevant API usage and examples.
2. **Strict Adherence**: Always strictly follow the code structures, object parameters, and naming conventions provided in the markdown files of the documentation.
3. **Cross-Referencing**: If an API requires a specific configuration object, read the corresponding configuration documentation file to ensure all required fields are included.
4. **Code Optimization**: When reviewing or optimizing existing ONLYOFFICE code, cross-check it against the best practices and latest API signatures found in the local documentation path.

## 🛠️ Typical Tool Usage Workflow
- Use your text search tools to find specific keywords (e.g., `window.Asc.plugin`, `Api.CreateDocument`) inside `/home/yang/projects/github/api.onlyoffice.com/site/docs/`.
- Read the specific markdown file to understand the context and parameter requirements before generating code.