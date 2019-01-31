import axios from 'axios';
import { clearStorage } from './auntificate';

axios.interceptors.response.use(undefined, err => {
  const res = err.response;
  if (res.status === 401) {
    clearStorage(localStorage);
    window.location = '/';
    return Promise.reject(res);
  }
});

// eslint-disable-next-line import/prefer-default-export
export const makeRequestApi = (options = {}) => {
  const AuthorizationStr = `${localStorage.smartUserTokenType} ${localStorage.smartUserToken}`;

  options.body = JSON.stringify(options.body);

  return dispatch => {
    if (options.startType) dispatch({ type: options.startType });
    axios({
      method: options.method,
      url: options.url,
      data: options.body,
      headers: {
        Authorization: AuthorizationStr,
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
      .then(response => {
        dispatch({ type: options.successType, payload: response.data });
        if (options.afterSuccess) options.afterSuccess({ response: response.data });
      })
      .catch(() => {
        if (options.errorType) dispatch({ type: options.errorType });
      });
  };
};
