const aclRules = require('./acl-rules.json');

module.exports = function (route, req) {
  let userRole = req.session.user ? req.session.user.role : 'visitor';
  let method = req.method.toLowerCase();
  method = method === 'patch' ? 'put' : method;
  let allowed = aclRules?.[userRole]?.[route]?.[method];
  return !!allowed;
};
