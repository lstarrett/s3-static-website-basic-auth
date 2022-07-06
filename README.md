# S3 Static Website with Basic Auth

This is a "single-click" solution for hosting a static website in S3, served via a CloudFront
distribution, with HTTPS enabled and enforced, and protected by HTTP Basic Authentication with a
shared username and password.

This is useful if you want to publicly host a static website for prototyping or testing, without the
fuss of full-featured user authentication, authorization, and session management, but with basic
HTTPS channel security with a trusted certificate, and basic access restriction via a shared
username and password, to make collaborative prototyping easy without exposing the site to the
world.

This application leverages the AWS CDK to synthesize and deploy a static website hosting application
with the following constructs:

* [**Private S3 bucket**](https://aws.amazon.com/s3/) to host static web resources
* [**CloudFront distribution**](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/distribution-overview.html)
  to distribute static web content hosted in S3 bucket over a trusted HTTPS channel via an internet routable domain name
* [**Lambda@Edge function**](https://aws.amazon.com/lambda/edge/) which implements HTTP Basic
  Authentication with a configurable username and password to restrict access to the static website


## Dependencies
* [**AWS Account**](https://aws.amazon.com/) and user with CLI credentials equipped with sufficient permissions to deploy
  CloudFormation stacks in the `us-east-1` region (region is a limitation of Lambda@Edge)
* [**AWS CLI**](https://aws.amazon.com/cli/) installed and configured
  * Install on macOS with `brew install aws-cli`
* [**AWS CDK**](https://docs.aws.amazon.com/cdk/v2/guide/home.html) installed and target AWS Account
  bootstrapped with `cdk bootstrap --profile <CLI profile>`
  * Install on macOS with `brew install aws-cdk`


## Usage
1. Clone this repository to your local machine
2. Edit the `config/default.json` config file:
   * **aws_account**: the account number for the target AWS Account (can be retrieved with `aws sts get-caller-identity --profile <CLI profile>`) 
   * **aws_region**: use `us-east-1`, which is currently a limitation of the Lambda@Edge CloudFront feature
   * **shared_user**: HTTP Basic Auth username which will protect access to deployed static website
   * **shared_pass**: HTTP Basic Auth password which will protect access to deployed static website
   * **website_root**: file inside the `./static` directory which will be served as the root file for the static website
3. Copy static website files into the `./static` directory, which will automatically be uploaded to S3 upon deploy
4. Deploy application with `cdk deploy --profile <CLI profile>`
5. After successful deployment, the CloudFront distribution ID and domain name will be printed as
   CloudFormation outputs
   * Visit the static website using the output domain name in any web browser
   * If files are changed in the `./static` directory and re-deployed, the CloudFront cache will take
     some time to update and reflect the changes. To force an update, use the CloudFront distribution
     ID and execute the following command: `aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"`
6. When the website domain name is visited, your browser will present an HTTP Basic Auth login dialog,
   which upon successful login with the username and password specified in `config/default.json`
   will grant access to the static website, beginning from the file spcified as the `website_root` in `config/default.json`
7. Empty the S3 static resources bucket, and undeploy application with `cdk destroy --profile <CLI profile>`
   * **NOTE**: due to a Lambda@Edge limitation, deletion of the HTTP basic auth lambda handler
     function may initially fail, but some time after (up to two hours) the CloudFront distribution
     is deleted the lambda function will disappear and the stack deletion will automatically complete.
	


## Other Useful commands
* `npm run test`         perform the jest unit tests (currently there are none)
* `cdk diff`             compare deployed stack with current state
* `cdk synth`            emits the synthesized CloudFormation template
