# Agentic Pourover
Uses your preferred agentic control flow to pour a pourover. Accepts a physical setup with one camera and five valves/pumps as MCP server. Mock MCP server with static images and mocked pouring logic implemented in `/mcp-controls`.

# Running
`cd mcp-controls && node src/index.ts`

Then in your agent, run `pourover.4.md`.

# Results
`gpt-5-mini` can successfully identify where the grounds are unevenly distributed and chooses to activate the correct valve to redistribute.