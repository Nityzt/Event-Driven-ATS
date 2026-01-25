#!/bin/bash

# Login and extract tokens
RESPONSE=$(curl -s -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123"
  }')

# Extract access token
ACCESS_TOKEN=$(echo $RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

# Extract refresh token
REFRESH_TOKEN=$(echo $RESPONSE | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)

# Save to file
echo "ACCESS_TOKEN=$ACCESS_TOKEN" > .tokens
echo "REFRESH_TOKEN=$REFRESH_TOKEN" >> .tokens

# Also export for current session
export ACCESS_TOKEN
export REFRESH_TOKEN

echo "✅ Tokens saved!"
echo ""
echo "Access Token (expires in 15min):"
echo "$ACCESS_TOKEN"
echo ""
echo "Refresh Token (expires in 7 days):"
echo "$REFRESH_TOKEN"
echo ""
echo "To use in commands:"
echo 'source .tokens'
echo 'curl -H "Authorization: Bearer $ACCESS_TOKEN" ...'