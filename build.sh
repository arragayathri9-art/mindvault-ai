#!/usr/bin/env bash
# exit on error
set -o errexit

# Install backend dependencies
echo "Installing backend dependencies..."
pip install -r backend_api/requirements.txt
