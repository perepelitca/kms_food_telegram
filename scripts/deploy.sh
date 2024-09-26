#!/bin/bash

SERVER_USER="admin"
SERVER_IP="51.250.37.216"
SSH_KEY="./ignore/server/private" # path to your private SSH key
PROJECT_DIR="/home/admin/kms_food_telegram" # path to the project folder on the server

# Set your environment variables by reading them from the local .env file
#export $(grep -v '^#' .env | xargs) # Load .env file into environment variables

# Load environment variables from the .env file into the current shell
while IFS='=' read -r key value; do
    # Ignore lines starting with '#'
    if [[ $key != \#* ]]; then
        export "$key=$value"
    fi
done < .env

# Connect to the server and run deployment commands, passing the local environment variables
ssh -i $SSH_KEY $SERVER_USER@$SERVER_IP << 'EOF'

# Navigate to the project directory
cd $PROJECT_DIR

# Reset the current state and pull the latest changes
echo "Pulling latest code from $BRANCH..."
git reset --hard HEAD
git pull origin main

# Export environment variables received from the local machine
export TELEGRAM_TOKEN='$TELEGRAM_TOKEN'
export PASSWORD_HASH='$PASSWORD_HASH'
export DB_PATH='$DB_PATH'

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the project with the environment variables
echo "Building the project..."
npm run build

# Reload pm2 to restart the bot
echo "Restarting the Node..."
pm2 reload tbot

echo "Deployment completed!"

EOF
