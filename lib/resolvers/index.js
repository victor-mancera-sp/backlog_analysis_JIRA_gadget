import api, { route } from '@forge/api';
import Resolver from '@forge/resolver';
const resolver = new Resolver();
resolver.define('getText', req => {
  console.log(req);
  return 'Hello, world!';
});
resolver.define('getSearch', async req => {
  const jql = await JQLBuilder(req.payload);
  console.log("JQL: ", jql);
  const response = await api.asUser().requestJira(route`/rest/api/3/search?jql=${jql}`, {
    headers: {
      'Accept': 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error(response.statusText);
  }
  const jsonResponse = await response.json();
  console.log("Response from Search API", jsonResponse);
});
const JQLBuilder = async req => {
  const response = await api.asUser().requestJira(route`/rest/api/3/field`, {
    headers: {
      'Accept': 'application/json'
    }
  });
  const fields = await response.json();
  let jql = "";
  fields.map(field => {
    console.log("Field: ", field.name);
    if (jql.length > 0 && req[field.name]) {
      jql += " AND ";
    }
    if (req[field.name]) {
      jql += `${field.name} IN (${req[field.name].map(value => `"${value}"`).join(',')})`;
    }
  });
  return jql;
};
export const handler = resolver.getDefinitions();