const config = require('config');

exports.handler = async(event) => {

  // Intercept the request which CloudFront wants to return to the user
  const request = event.Records[0].cf.request;

  // Check for authorization headers, and authorize with HTTP Basic Auth
  let isAllowedAccess = false;
  if (request && request.headers && request.headers.authorization) {
    const user = config.get('shared_user');
    const pass = config.get('shared_pass');
    const basicAuthHeader = request.headers.authorization[0].value;
    const authString = 'Basic ' + Buffer.from(user + ':' + pass).toString('base64');
    isAllowedAccess = (basicAuthHeader === authString);
  }

  // If a correct Basic Auth user/pass pair was provided, return the request to CloudFront unaltered
  if (isAllowedAccess) {
    return request;
  }

  // Otherwise, return a 401, including headers which indicate to the user's browser to present a basic auth prompt
  else {
    const response = {
      status: 401,
      body: JSON.stringify('Access denied'),
      headers: {
        'www-authenticate': [{ key: 'WWW-Authenticate', value: 'Basic' }]
      }
    };
    return response;
  }

};
