#!/bin/bash

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Commands for Render (Linux)
    apt-get update
    apt-get install -y chromium-browser
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # Commands for macOS
    brew update
    brew install chromium
else
    echo "Unsupported OS: $OSTYPE"
    exit 1
fi
