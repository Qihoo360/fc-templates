#!/bin/bash

# LandPPT Docker Health Check Script
# This script performs comprehensive health checks for the LandPPT application

set -e

# Configuration
HOST=${HOST:-localhost}
PORT=${PORT:-8000}
TIMEOUT=${HEALTH_CHECK_TIMEOUT:-30}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

# Check if service is responding
check_http_health() {
    log "Checking HTTP health endpoint..."
    
    if curl -f -s --max-time $TIMEOUT "http://${HOST}:${PORT}/health" > /dev/null; then
        log "✅ HTTP health check passed"
        return 0
    else
        error "❌ HTTP health check failed"
        return 1
    fi
}

# Check if API documentation is accessible
check_api_docs() {
    log "Checking API documentation..."
    
    if curl -f -s --max-time $TIMEOUT "http://${HOST}:${PORT}/docs" > /dev/null; then
        log "✅ API documentation accessible"
        return 0
    else
        warn "⚠️ API documentation not accessible"
        return 1
    fi
}

# Check database connectivity
check_database() {
    log "Checking database connectivity..."
    
    if [ -f "/app/data/landppt.db" ]; then
        log "✅ Database file exists"
        return 0
    else
        warn "⚠️ Database file not found"
        return 1
    fi
}

# Check required directories
check_directories() {
    log "Checking required directories..."
    
    local dirs=("/app/uploads" "/app/temp" "/app/data")
    local all_good=true
    
    for dir in "${dirs[@]}"; do
        if [ -d "$dir" ]; then
            log "✅ Directory $dir exists"
        else
            warn "⚠️ Directory $dir missing"
            all_good=false
        fi
    done
    
    if $all_good; then
        return 0
    else
        return 1
    fi
}

# Check Python process
check_python_process() {
    log "Checking Python process..."
    
    if pgrep -f "python.*run.py" > /dev/null; then
        log "✅ Python process running"
        return 0
    else
        error "❌ Python process not found"
        return 1
    fi
}

# Main health check function
main() {
    log "Starting LandPPT health check..."
    
    local exit_code=0
    
    # Critical checks (must pass)
    if ! check_http_health; then
        exit_code=1
    fi
    
    if ! check_python_process; then
        exit_code=1
    fi
    
    # Non-critical checks (warnings only)
    check_api_docs || true
    check_database || true
    check_directories || true
    
    if [ $exit_code -eq 0 ]; then
        log "🎉 All critical health checks passed!"
    else
        error "💥 Some critical health checks failed!"
    fi
    
    exit $exit_code
}

# Run health check
main "$@"
