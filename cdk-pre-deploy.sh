#!/bin/bash

# CDK pre-deploy hook (do stuff before `cdk deploy` executes)

# Copy config/default.json into lambda@edge package before deploying
mkdir -p edge-lambda/config
cp config/default.json edge-lambda/config/default.json

# Install lambda@edge dependencies
pushd edge-lambda
npm install
popd

