#!/bin/bash

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

usage() {
    echo -e "${GREEN}Usage:${NC} $0 [\"migration message\"]"
    echo -e "Example: $0 \"Added user table\""
    exit 1
}

if [ "$#" -eq 0 ]; then
    echo -e "${RED}Error:${NC} No migration message provided"
    usage
fi

echo -e "${GREEN}Generating migration with message:${NC} \"$1\""
alembic revision --autogenerate -m "$1"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}Migration created successfully!${NC}"
else
    echo -e "${RED}Error:${NC} Failed to create migration"
    exit 1
fi