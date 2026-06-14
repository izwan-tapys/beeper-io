<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:token-saving-rules -->
# Token Saving & Context Hygiene Guidelines
To conserve tokens and maintain a fast, efficient context window:
1. **Avoid reading large lockfiles or metadata**: Do not read `package-lock.json` or `tsconfig.tsbuildinfo` unless explicitly requested by the user.
2. **Perform targeted searches**: When using `grep_search`, specify precise file patterns in the `Includes` field (e.g., `*.ts`, `*.tsx`, `*.js`) and search only in relevant folders (e.g., `src/`). Avoid broad repository-wide wildcard searches.
3. **Avoid reading database schema dumps fully**: If you need database details, look up specific table patterns instead of opening `migrations.sql` in its entirety.
4. **Keep file reads narrow**: Use line ranges in `view_file` to only load the functions or blocks necessary for the task, rather than reading entire large files.
<!-- END:token-saving-rules -->
