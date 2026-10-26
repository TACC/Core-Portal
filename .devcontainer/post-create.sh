sudo chown vscode:vscode client/node_modules
sudo chown vscode:vscode server/.venv
uv sync --locked --all-groups --directory=server
pnpm install --recursive --frozen-lockfile -C client
