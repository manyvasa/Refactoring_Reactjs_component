export const buildQuery = query => (
  Object.keys(query).map(val => `${val}=${query[val]}`).join('&')
);

export const buildHeaders = () => {
  const headers = new Headers();
  headers.append('Accept', 'application/json');
  headers.append('Content-Type', 'application/json; charset=utf-8');
  return headers;
};

export const buildHeadersWithPass = (localStorage) => {
  const headers = new Headers();
  headers.append('Accept', 'application/json');
  headers.append('Content-Type', 'application/json; charset=utf-8');
  const AuthorizationStr = `${localStorage.smartUserTokenType} ${localStorage.smartUserToken}`;
  headers.append('Authorization', `${AuthorizationStr}`);
  return headers;
};

export const headers = buildHeaders();
export const checkStatus = response => {
  if (response.status >= 200 && response.status < 300) {
    return Promise.resolve(response);
  }
  return Promise.reject(new Error(response.statusText));
};

export const parseJson = response => response.json();

export const makeRequest = (url, options = {}, auth = false,) => {
  options.body = JSON.stringify(options.body);
  return fetch(url, Object.assign({ headers: auth === false ? headers : buildHeadersWithPass(auth) }, options))
    .then(checkStatus)
    .then(parseJson);
};
