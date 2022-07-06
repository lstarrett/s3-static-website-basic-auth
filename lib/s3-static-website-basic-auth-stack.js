// const { Stack, Duration } = require('aws-cdk-lib');
const { Stack, RemovalPolicy, CfnOutput } = require('aws-cdk-lib');

const config = require('config');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const lambda = require('aws-cdk-lib/aws-lambda');
const path = require('node:path');
const s3 = require('aws-cdk-lib/aws-s3');
const s3deploy = require('aws-cdk-lib/aws-s3-deployment');
const s3origin = require('aws-cdk-lib/aws-cloudfront-origins');

class S3StaticWebsiteBasicAuthStack extends Stack {

  /**
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // The S3 bucket which will hold static web resources
    const staticResourcesBucket = new s3.Bucket(this, 'StaticResources', {
      versioned: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // S3 bucket deployment which automatically uploads everything in the `./static` directory to
    // the static resources bucket
    new s3deploy.BucketDeployment(this, 'DeployStaticResources', {
      sources: [s3deploy.Source.asset('./static')],
      destinationBucket: staticResourcesBucket
    });
    
    // Lambda@Edge function which will intercept responses from the CloudFront Distribution and
    // implement HTTP Basic Auth to restrict access to holders of a shared username/password
    const basicAuthHandler = new cloudfront.experimental.EdgeFunction(this, 'BasicAuthHandler', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'basic-auth.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../edge-lambda'))
    });

    // Allow CloudFront to serve resources hosted in the static resources S3 bucket
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'OriginAccessIdentity');
    staticResourcesBucket.grantRead(originAccessIdentity);

    // CloudFront distribution which will serve requests for resources hosted in static resources S3
    const cfDistribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultRootObject: config.get('website_root'),
      defaultBehavior: {
        origin: new s3origin.S3Origin(staticResourcesBucket, {originAccessIdentity}),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        edgeLambdas: [
          {
            functionVersion: basicAuthHandler.currentVersion,
            eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST
          }
        ]
      }
    });

    // Print helpful outputs
    new CfnOutput(this, 'distributionId', { value: cfDistribution.distributionId });
    new CfnOutput(this, 'domainName', { value: cfDistribution.domainName });

  }
}

module.exports = { S3StaticWebsiteBasicAuthStack }
