import { combineReducers } from 'redux';
import activeStack from '../data/Admin/ActiveStack/reducer';
import operatorPage from '../data/OperatorPage/reducer';

export default combineReducers({
  activeStack,
  operatorPage,
});
