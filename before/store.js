import { createStore } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';

const reducer = () => ({});

const store = (process.env.NODE_ENV === 'production') ?
  createStore(reducer) :
  createStore(reducer, composeWithDevTools());

export default store;

