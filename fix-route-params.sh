#!/bin/bash

# Find all route.ts files in the app/api directory
ROUTE_FILES=$(find app/api -name "route.ts")

# Loop through each file
for file in $ROUTE_FILES; do
  echo "Processing $file..."
  
  # Check if the file contains the Promise<{ id: string }> pattern
  if grep -q "params: Promise<{ id: string }>" "$file"; then
    echo "Fixing Promise params in $file"
    
    # Replace Promise<{ id: string }> with { id: string }
    sed -i 's/params: Promise<{ id: string }>/params: { id: string }/g' "$file"
    
    # Replace await Promise.resolve(context.params) with context.params
    sed -i 's/await Promise.resolve(context.params)/context.params/g' "$file"
    
    # Replace await context.params with context.params
    sed -i 's/await context.params/context.params/g' "$file"
  fi
done

echo "All route files processed!"
