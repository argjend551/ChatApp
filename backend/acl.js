import fs from 'fs';

// Read the contents of the JSON file
const data = fs.readFileSync('backend/acl-rules.json', 'utf8');

// Parse the JSON string into an object
const aclRules = JSON.parse(data);

export default function (route, req) {
  let userRole = req.session.user ? req.session.user.role : 'visitor';
  let method = req.method.toLowerCase();
  method = method === 'patch' ? 'put' : method;
  let allowed = aclRules?.[userRole]?.[route]?.[method];
  return !!allowed;
}
