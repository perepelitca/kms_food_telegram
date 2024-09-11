#!/bin/bash

# Define variables
USER=admin        # Server SSH username
SERVER_IP=51.250.37.216
PROJECT_DIR=/home/admin/kms_food_telegram   # The path to the project on the server
BRANCH=main     # The branch you want to pull from
PROCESS_NAME=kms_food_telegram  # The name of the app in PM2

# Pull latest code and build the project with environment variables from local .env
ssh $USER@$SERVER_IP << 'EOF'
  cd $PROJECT_DIR
  echo "Pulling latest code from $BRANCH..."
  git fetch origin $BRANCH
  git reset --hard origin/$BRANCH

  echo "Installing dependencies..."
  npm install

  echo "Building the project..."
  $(cat .env | xargs) npm run build

  echo "Restarting the Node..."
  pm2 restart $PROCESS_NAME

  echo "Deployment completed!"
EOF
