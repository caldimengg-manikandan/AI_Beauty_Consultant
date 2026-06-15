#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# pre-commit-check.sh
# Run this before committing to catch issues early.
# Install as git hook: cp scripts/pre-commit-check.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit
# ─────────────────────────────────────────────────────────────────────────────

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'

echo -e "${YELLOW}Running pre-commit checks...${NC}"

# 1. Python syntax check
echo -e "\n${YELLOW}[1/4] Python syntax check...${NC}"
FAILED=0
while IFS= read -r -d '' pyfile; do
  if ! python3 -m py_compile "$pyfile" 2>/dev/null; then
    echo -e "  ${RED}FAIL${NC}: $pyfile"
    FAILED=1
  fi
done < <(find Backend -name "*.py" -not -path "*/__pycache__/*" -print0)

if [ "$FAILED" -eq 1 ]; then
  echo -e "${RED}Python syntax check FAILED. Fix the files above before committing.${NC}"
  exit 1
fi
echo -e "  ${GREEN}All Python files OK${NC}"

# 2. Check for internal error exposure
echo -e "\n${YELLOW}[2/4] Security: checking for str(e) exposure...${NC}"
if grep -rn "detail=str(e)" Backend/app/api/ 2>/dev/null | grep -v ".pyc"; then
  echo -e "${RED}ERROR: Found detail=str(e) — internal errors must not be exposed to clients.${NC}"
  exit 1
fi
echo -e "  ${GREEN}No internal error exposure found${NC}"

# 3. Check for hardcoded secrets
echo -e "\n${YELLOW}[3/4] Security: checking for hardcoded secrets...${NC}"
SECRETS_FOUND=0
if grep -rn "super_secret_key\|CHANGE_THIS_SECRET\|hardcoded" Backend/app/ 2>/dev/null | grep -v ".pyc" | grep -v "test_"; then
  echo -e "  ${YELLOW}Warning: potential hardcoded secrets detected — review above${NC}"
fi
echo -e "  ${GREEN}Secret check complete${NC}"

# 4. Frontend: check ErrorBoundary exists
echo -e "\n${YELLOW}[4/4] Frontend: ErrorBoundary check...${NC}"
if [ ! -f "Frontend/frontend/src/components/ErrorBoundary.js" ]; then
  echo -e "${RED}ERROR: ErrorBoundary.js is missing!${NC}"
  exit 1
fi
echo -e "  ${GREEN}ErrorBoundary.js present${NC}"

echo -e "\n${GREEN}All pre-commit checks passed!${NC}"
