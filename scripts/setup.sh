#!/bin/bash

# GENIX OS Setup Script
# This script creates necessary directories and sets up the environment

echo "Setting up GENIX OS..."

# Create project and sandbox directories
PROJECT_DIR="$HOME/projects"
SANDBOX_DIR="$HOME/genix-sandbox"

mkdir -p "$PROJECT_DIR"
mkdir -p "$SANDBOX_DIR"

echo "Created directories:"
echo "  - $PROJECT_DIR"
echo "  - $SANDBOX_DIR"

# Set permissions
chmod 755 "$PROJECT_DIR"
chmod 755 "$SANDBOX_DIR"

echo "Setup complete!"

