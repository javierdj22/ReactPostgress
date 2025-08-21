#!/bin/bash

# Build and deploy all services
echo "Starting deployment..."

# Pull latest changes
git pull origin main

# Build and start containers
docker-compose up -d --build

# Check services health
echo "Checking services health..."
sleep 10

# Check each service
services=("react-app" "n8n" "mcp" "postgres")
for service in "${services[@]}"
do
    if docker-compose ps | grep -q "$service.*Up"; then
        echo "$service is running"
    else
        echo "Error: $service failed to start"
        exit 1
    fi
done

echo "Deployment completed successfully!"
