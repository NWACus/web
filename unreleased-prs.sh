#!/bin/bash

# Script to show PRs in main that haven't been released yet
# Displays with dates and clickable GitHub links

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Fetching latest release branch...${NC}"
git fetch origin release:release 2>/dev/null || true

echo -e "\n${GREEN}PRs in main that haven't been released yet:${NC}\n"

# Get the GitHub repo URL from git remote
REPO_URL=$(git config --get remote.origin.url | sed 's/\.git$//' | sed 's/git@github.com:/https:\/\/github.com\//')

# Get commits in main but not in release, with dates
git log release..main --first-parent --pretty=format:"%h|%ad|%s" --date=short | while IFS='|' read -r hash date message; do
  # Extract PR number from commit message using regex
  if [[ $message =~ Merge\ pull\ request\ \#([0-9]+) ]]; then
    PR_NUMBER="${BASH_REMATCH[1]}"
    PR_LINK="${REPO_URL}/pull/${PR_NUMBER}"
    # Extract branch name from message
    BRANCH_NAME=$(echo "$message" | sed 's/.*from [^/]*\///')
    echo -e "${BLUE}#${PR_NUMBER}${NC} - ${date} - ${BRANCH_NAME}"
    echo -e "  ${PR_LINK}"
    echo ""
  else
    # Non-PR commit
    echo -e "${date} - ${message}"
    echo ""
  fi
done

UNRELEASED_COUNT=$(git log release..main --first-parent --oneline | wc -l | tr -d ' ')
echo -e "${YELLOW}Total unreleased PRs: ${UNRELEASED_COUNT}${NC}"
