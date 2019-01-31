import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import reducer from './reducers/rootReducer';

// const reducer = () => ({});

const store = (process.env.NODE_ENV === 'production') ?
  createStore(reducer) :
  createStore(reducer, composeWithDevTools(applyMiddleware(thunk)));

export default store;

