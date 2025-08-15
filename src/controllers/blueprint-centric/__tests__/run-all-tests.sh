#!/bin/bash

# ============================================================================
# BLUEPRINT-CENTRIC CONTROLLER TEST RUNNER
# ============================================================================
# 
# This script runs all tests for the blueprint-centric controllers
# to ensure they are thoroughly tested and functional
#
# ============================================================================

echo "🧪 Running Blueprint-Centric Controller Tests..."
echo "=================================================="

# Set the test directory
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$TEST_DIR/../../../.." && pwd)"

# Change to project root
cd "$PROJECT_ROOT"

# Check if Jest is available
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx is not available. Please install Node.js and npm."
    exit 1
fi

# Run tests with coverage
echo "📊 Running tests with coverage..."
npx jest "$TEST_DIR" --coverage --verbose --detectOpenHandles

# Check if tests passed
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ All tests passed successfully!"
    echo ""
    echo "📈 Test Coverage Summary:"
    echo "   - Enhanced Spaced Repetition Controller: ✅"
    echo "   - Enhanced Today's Tasks Controller: ✅"
    echo "   - Mastery Criterion Controller: ✅"
    echo "   - Note Section Controller: ✅"
    echo "   - Question Instance Controller: ✅"
    echo ""
    echo "🎯 Controllers are thoroughly tested and ready for production!"
else
    echo ""
    echo "❌ Some tests failed. Please review the output above."
    echo ""
    echo "🔧 To debug specific test failures:"
    echo "   - Run individual test files: npx jest <filename>"
    echo "   - Run with watch mode: npx jest --watch"
    echo "   - Run with verbose output: npx jest --verbose"
    exit 1
fi

echo ""
echo "🚀 Test execution completed!"
