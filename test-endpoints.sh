#!/bin/bash

# Comprehensive API Testing Script for GarageGuru
# Tests both local (localhost:5000) and production (vercel) endpoints

BASE_URL_LOCAL="http://localhost:5000"
BASE_URL_PROD="https://garage-guru-fawn.vercel.app"

# Choose environment
if [ "$1" == "local" ]; then
    BASE_URL=$BASE_URL_LOCAL
    echo "Testing LOCAL environment: $BASE_URL"
else
    BASE_URL=$BASE_URL_PROD
    echo "Testing PRODUCTION environment: $BASE_URL"
fi

echo "==============================================="
echo "GarageGuru API Endpoint Testing"
echo "==============================================="

# 1. Health Check
echo ""
echo "1. Health Check:"
curl -s "$BASE_URL/api/health" | head -c 200
echo ""

# 2. Login and get token
echo ""
echo "2. Login Test:"
LOGIN_RESPONSE=$(curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"ananthautomotivegarage@gmail.com","password":"password123"}' \
  -s)

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed - no token received"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
else
    echo "✅ Login successful - token received"
    echo "Token: ${TOKEN:0:30}..."
fi

# 3. User Profile
echo ""
echo "3. User Profile:"
PROFILE_RESPONSE=$(curl -s "$BASE_URL/api/user/profile" \
  -H "Authorization: Bearer $TOKEN")
echo $PROFILE_RESPONSE | head -c 200
echo "..."

# 4. Garages (Super Admin)
echo ""
echo "4. Garages (Super Admin only):"
GARAGES_RESPONSE=$(curl -s "$BASE_URL/api/garages" \
  -H "Authorization: Bearer $TOKEN")
echo $GARAGES_RESPONSE | head -c 200
echo "..."

# 5. Customers with garageId
echo ""
echo "5. Customers:"
CUSTOMERS_RESPONSE=$(curl -s "$BASE_URL/api/customers?garageId=0c3bf28f-06db-40da-81a3-12984eb6cdee" \
  -H "Authorization: Bearer $TOKEN")
echo $CUSTOMERS_RESPONSE | head -c 200
echo "..."

# 6. Spare Parts
echo ""
echo "6. Spare Parts:"
PARTS_RESPONSE=$(curl -s "$BASE_URL/api/spare-parts?garageId=0c3bf28f-06db-40da-81a3-12984eb6cdee" \
  -H "Authorization: Bearer $TOKEN")
echo $PARTS_RESPONSE | head -c 200
echo "..."

# 7. Job Cards
echo ""
echo "7. Job Cards:"
JOBCARDS_RESPONSE=$(curl -s "$BASE_URL/api/job-cards?garageId=0c3bf28f-06db-40da-81a3-12984eb6cdee" \
  -H "Authorization: Bearer $TOKEN")
echo $JOBCARDS_RESPONSE | head -c 200
echo "..."

# 8. Legacy Route - Garage Job Cards
echo ""
echo "8. Legacy Route - Garage Job Cards:"
LEGACY_JOBCARDS=$(curl -s "$BASE_URL/api/garages/0c3bf28f-06db-40da-81a3-12984eb6cdee/job-cards" \
  -H "Authorization: Bearer $TOKEN")
echo $LEGACY_JOBCARDS | head -c 200
echo "..."

# 9. Legacy Route - Sales Stats
echo ""
echo "9. Legacy Route - Sales Stats:"
SALES_STATS=$(curl -s "$BASE_URL/api/garages/0c3bf28f-06db-40da-81a3-12984eb6cdee/sales/stats" \
  -H "Authorization: Bearer $TOKEN")
echo $SALES_STATS | head -c 200
echo "..."

# 10. Error Cases
echo ""
echo "10. Error Testing:"

# Missing garage ID
echo "  a) Missing garageId for super admin:"
NO_GARAGE_RESPONSE=$(curl -s "$BASE_URL/api/customers" \
  -H "Authorization: Bearer $TOKEN")
echo $NO_GARAGE_RESPONSE | head -c 150
echo "..."

# Invalid token
echo "  b) Invalid token:"
INVALID_TOKEN_RESPONSE=$(curl -s "$BASE_URL/api/customers?garageId=0c3bf28f-06db-40da-81a3-12984eb6cdee" \
  -H "Authorization: Bearer invalid_token_here")
echo $INVALID_TOKEN_RESPONSE | head -c 150
echo "..."

# Non-existent endpoint
echo "  c) 404 for unknown endpoint:"
NOT_FOUND_RESPONSE=$(curl -s "$BASE_URL/api/nonexistent")
echo $NOT_FOUND_RESPONSE | head -c 150
echo "..."

echo ""
echo "==============================================="
echo "Testing Complete!"
echo "==============================================="

# Summary
echo ""
echo "Quick validation:"
if [[ $CUSTOMERS_RESPONSE == *"data"* ]]; then
    echo "✅ Customers endpoint working"
else
    echo "❌ Customers endpoint failed"
fi

if [[ $PARTS_RESPONSE == *"data"* ]]; then
    echo "✅ Spare parts endpoint working"
else
    echo "❌ Spare parts endpoint failed"
fi

if [[ $JOBCARDS_RESPONSE == *"data"* ]]; then
    echo "✅ Job cards endpoint working"
else
    echo "❌ Job cards endpoint failed"
fi

if [[ $LEGACY_JOBCARDS == *"data"* ]]; then
    echo "✅ Legacy job cards endpoint working"
else
    echo "❌ Legacy job cards endpoint failed"
fi

if [[ $SALES_STATS == *"data"* ]]; then
    echo "✅ Sales stats endpoint working"
else
    echo "❌ Sales stats endpoint failed"
fi