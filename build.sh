#!/bin/bash

# Set environment variables to ignore TypeScript errors
export NEXT_IGNORE_TYPESCRIPT_ERRORS=true
export NEXT_IGNORE_ESLINT_ERRORS=true

# Run the build command with the --no-lint flag
npx next build --no-lint
