#!/bin/bash

# Script to get your Mac's local IP address for Expo development
# This IP should be used in .env file for physical device testing

echo "Finding your Mac's local IP address..."
echo ""

# Try common network interfaces
INTERFACES=("en0" "en1" "eth0")

for interface in "${INTERFACES[@]}"; do
    IP=$(ipconfig getifaddr $interface 2>/dev/null)
    if [ ! -z "$IP" ]; then
        echo "✅ Found IP address on interface $interface: $IP"
        echo ""
        echo "Update your .env file with:"
        echo "EXPO_PUBLIC_API_URL=http://$IP:8080/api/v1"
        echo ""
        exit 0
    fi
done

# Fallback: try ifconfig
IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)

if [ ! -z "$IP" ]; then
    echo "✅ Found IP address: $IP"
    echo ""
    echo "Update your .env file with:"
    echo "EXPO_PUBLIC_API_URL=http://$IP:8080/api/v1"
    echo ""
else
    echo "❌ Could not automatically detect IP address."
    echo ""
    echo "Please find it manually:"
    echo "1. Open System Settings > Network"
    echo "2. Select your active connection (Wi-Fi or Ethernet)"
    echo "3. Click 'Details' to see your IP address"
    echo ""
    echo "Then update your .env file with:"
    echo "EXPO_PUBLIC_API_URL=http://YOUR_IP:8080/api/v1"
    echo ""
fi
