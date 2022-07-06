#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const config = require('config');
const { S3StaticWebsiteBasicAuthStack } = require('../lib/s3-static-website-basic-auth-stack');

const app = new cdk.App();
new S3StaticWebsiteBasicAuthStack(app, 'S3StaticWebsiteBasicAuthStack', {

  // NOTE: Lambda@edge currently only supports the us-east-1 region, so
  //       ensure 'aws_region' is set to 'us-east-1' in config/default.json
  env: { account: config.get('aws_account'), region: config.get('aws_region') }

  // For more information on env setup, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html

});
