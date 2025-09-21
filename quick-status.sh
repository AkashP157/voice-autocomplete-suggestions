#!/bin/bash

# Voice Autocomplete Suggestions - Quick Status Script
# Run this script to get instant project health overview

echo "🚀 Voice Autocomplete Suggestions - Project Status"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📊 QUICK HEALTH CHECK"
echo "---------------------"

# Git status
echo "🔄 Git Status:"
git status --porcelain
if [ $? -eq 0 ]; then
    if [ -z "$(git status --porcelain)" ]; then
        echo "   ✅ Working tree clean"
    else
        echo "   ⚠️  Uncommitted changes found"
    fi
else
    echo "   ❌ Git repository issue"
fi

# Last commit
echo "📝 Last Commit:"
git log --oneline -1
echo ""

# Core file syntax check
echo "🔍 Core Files Syntax:"
if node -c script.js 2>/dev/null; then
    echo "   ✅ script.js - OK"
else
    echo "   ❌ script.js - Syntax errors"
fi

if node -c mobile.js 2>/dev/null; then
    echo "   ✅ mobile.js - OK"
else
    echo "   ❌ mobile.js - Syntax errors"
fi

echo ""

# Performance check
echo "📈 Performance Metrics:"
if [ -f "performance-report.json" ]; then
    echo "   📄 Latest report available (performance-report.json)"
    # Extract key metrics if possible
    if command -v jq &> /dev/null; then
        echo "   📦 Bundle Size: $(jq -r '.[0].totalSize // "N/A"' performance-report.json)"
        echo "   ⏱️  Load Time: $(jq -r '.[1].loadTime // "N/A"' performance-report.json)"
        echo "   💾 Memory: $(jq -r '.[2].heapUsed // "N/A"' performance-report.json)"
    fi
else
    echo "   ❌ No performance report found"
fi

echo ""

# Security check
echo "🔒 Security Status:"
if [ -f "security-report.json" ]; then
    echo "   📄 Latest security report available"
    # Count issues if possible
    if command -v jq &> /dev/null; then
        high_issues=$(jq '[.[] | select(.severity == "HIGH")] | length' security-report.json 2>/dev/null || echo "0")
        medium_issues=$(jq '[.[] | select(.severity == "MEDIUM")] | length' security-report.json 2>/dev/null || echo "0")
        echo "   🚨 High Issues: $high_issues"
        echo "   ⚠️  Medium Issues: $medium_issues"
    fi
else
    echo "   ❌ No security report found"
fi

echo ""

# Test status
echo "🧪 Test Status:"
if [ -f "tests/run-tests.js" ]; then
    echo "   ✅ Test framework available"
    echo "   💡 Run 'npm test' for full test suite"
else
    echo "   ❌ Test framework not found"
fi

echo ""

# Quick commands
echo "⚡ QUICK COMMANDS"
echo "-----------------"
echo "🌐 Start development:     npm start"
echo "🧪 Run tests:            npm test"
echo "📊 Performance check:    npm run performance"
echo "🔒 Security audit:       npm run security"
echo "📖 View dashboard:       cat PROJECT-DASHBOARD.md"
echo "📝 View dev log:         cat DEVELOPMENT-LOG.md"
echo ""

echo "🎯 RECOMMENDED NEXT STEPS"
echo "-------------------------"
if [ -f "security-report.json" ]; then
    # Check if there are security issues
    if command -v jq &> /dev/null; then
        issues=$(jq 'length' security-report.json 2>/dev/null || echo "0")
        if [ "$issues" -gt 0 ]; then
            echo "1. 🚨 Fix security issues (check security-report.json)"
        fi
    fi
fi

echo "2. 🧪 Run test suite: npm test"
echo "3. 🌐 Start development server: npm start"
echo "4. 📱 Test mobile interface: http://localhost:8000/mobile.html"

echo ""
echo "📄 For detailed status, check PROJECT-DASHBOARD.md"
echo "📝 For development history, check DEVELOPMENT-LOG.md"
echo ""
echo "✨ Happy coding! 🚀"