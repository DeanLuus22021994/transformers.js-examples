#!/bin/bash

# This script clones all the submodules and configures them properly

mkdir -p /workspaces/transformers.js-examples/.devcontainer/scripts
cd /workspaces/transformers.js-examples

# Configure Git to use the Personal Access Token
git config --global url."https://${PERSONAL_ACCESS_TOKEN}@github.com/".insteadOf "https://github.com/"

echo "Initializing and updating submodules..."
git submodule update --init --recursive || {
  echo "Failed to initialize submodules. Trying individual cloning..."
}

# Function to clone or update a submodule
clone_or_update_repo() {
  local name=$1
  local url=$2
  local path=$3
  local branch=$4

  # Replace github.com with the token-based URL if needed
  url=$(echo $url | sed "s|https://github.com/|https://${PERSONAL_ACCESS_TOKEN}@github.com/|")

  if [ -d "$path/.git" ]; then
    echo "Updating repository: $name"
    cd "$path"
    git fetch origin
    git checkout "${branch:-main}"
    git pull origin "${branch:-main}"
    git submodule update --init --recursive
    cd - > /dev/null
  else
    echo "Cloning repository: $name"
    mkdir -p "$(dirname "$path")"
    git clone --recurse-submodules --branch "${branch:-main}" "$url" "$path"
  fi
}

# Clone each repository from the .gitmodules file
clone_or_update_repo "transformers.js" "https://github.com/huggingface/transformers.js.git" "/workspaces/transformers.js" "main"
clone_or_update_repo "runner-images" "https://github.com/DeanLuus22021994/runner-images.git" "/workspaces/runner-images" "main"
clone_or_update_repo "servers" "https://github.com/DeanLuus22021994/servers.git" "/workspaces/servers" "main"
clone_or_update_repo "starter-workflows" "https://github.com/DeanLuus22021994/starter-workflows.git" "/workspaces/starter-workflows" "main"
clone_or_update_repo "github-mcp-server" "https://github.com/DeanLuus22021994/github-mcp-server.git" "/workspaces/github-mcp-server" "main"
clone_or_update_repo "vscode" "https://github.com/DeanLuus22021994/vscode.git" "/workspaces/vscode" "main"
clone_or_update_repo "linuxkit" "https://github.com/DeanLuus22021994/linuxkit.git" "/workspaces/linuxkit" "main"

echo "All repositories cloned or updated successfully."
