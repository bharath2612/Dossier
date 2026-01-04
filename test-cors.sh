#!/bin/bash

# Test CORS Configuration
# Run this script to verify CORS is working correctly

echo "🧪 Testing CORS Configuration"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend URL is provided
# Usage: ./test-cors.sh [BACKEND_URL] [FRONTEND_URL]
# Example: ./test-cors.sh http://localhost:8080 http://localhost:3000
BACKEND_URL="${1:-http://localhost:8080}"
FRONTEND_URL="${2:-http://localhost:3000}"

echo "📡 Backend URL: $BACKEND_URL"
echo "🌐 Frontend URL: $FRONTEND_URL"
echo ""

# Test 1: Health Check
echo "Test 1: Health Check"
echo "--------------------"
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/health")
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo "Response: $HEALTH_RESPONSE"
else
    echo -e "${RED}✗ Health check failed${NC}"
fi
echo ""

# Test 2: OPTIONS Preflight Request
echo "Test 2: OPTIONS Preflight Request"
echo "-----------------------------------"
PREFLIGHT_HEADERS=$(curl -s -I -X OPTIONS "$BACKEND_URL/api/preprocess" \
    -H "Origin: $FRONTEND_URL" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type")

if echo "$PREFLIGHT_HEADERS" | grep -qi "Access-Control-Allow-Origin"; then
    echo -e "${GREEN}✓ CORS preflight passed${NC}"
    echo "$PREFLIGHT_HEADERS" | grep -i "access-control"
else
    echo -e "${RED}✗ CORS preflight failed${NC}"
    echo "Headers received:"
    echo "$PREFLIGHT_HEADERS"
fi
echo ""

# Test 3: Check for double slashes
echo "Test 3: URL Construction"
echo "------------------------"
TEST_URL="$BACKEND_URL/api/preprocess"
if echo "$TEST_URL" | grep -q "//api"; then
    echo -e "${RED}✗ Double slash detected: $TEST_URL${NC}"
    echo -e "${YELLOW}⚠ Remove trailing slash from NEXT_PUBLIC_API_URL${NC}"
else
    echo -e "${GREEN}✓ No double slash: $TEST_URL${NC}"
fi
echo ""

# Test 4: POST Request Test (requires test prompt)
echo "Test 4: POST Request Test"
echo "-------------------------"
POST_RESPONSE=$(curl -s -X POST "$BACKEND_URL/api/preprocess" \
    -H "Content-Type: application/json" \
    -H "Origin: $FRONTEND_URL" \
    -d '{"prompt":"Test prompt for B2B SaaS sales strategies"}' \
    -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$POST_RESPONSE" | grep "HTTP_STATUS:" | cut -d':' -f2)
RESPONSE_BODY=$(echo "$POST_RESPONSE" | grep -v "HTTP_STATUS:")

if [ "$HTTP_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ POST request successful (HTTP $HTTP_STATUS)${NC}"
    echo "Response preview: ${RESPONSE_BODY:0:200}..."
elif [ "$HTTP_STATUS" = "500" ] || [ "$HTTP_STATUS" = "400" ]; then
    echo -e "${YELLOW}⚠ POST request completed with HTTP $HTTP_STATUS${NC}"
    echo "This might be normal if API keys aren't configured"
    echo "Response: $RESPONSE_BODY"
else
    echo -e "${RED}✗ POST request failed (HTTP $HTTP_STATUS)${NC}"
    echo "Response: $RESPONSE_BODY"
fi
echo ""

# Summary
echo "================================"
echo "📊 Test Summary"
echo "================================"
echo ""
echo "If all tests passed, your CORS configuration is correct!"
echo ""
echo "Next steps:"
echo "1. Deploy backend: cd backend && vercel --prod"
echo "2. Deploy frontend: cd frontend && vercel --prod"
echo "3. Test on production URL"
echo ""
echo "If tests failed, check:"
echo "• Environment variables are set correctly"
echo "• No trailing slash in NEXT_PUBLIC_API_URL"
echo "• Backend is deployed and running"
echo "• CORS configuration in backend/src/index.ts"


