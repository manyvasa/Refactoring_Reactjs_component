import { makeRequestApi } from 'utils/api';
import AppConfig from 'configs/AppConfig';

const API_HOST = AppConfig[process.env.NODE_ENV].API_HOST;

const DATA_SUCCESS = 'DATA_SUCCESS';
const DATA_FAILED = 'DATA_FAILED';

const NEW_TASK_START = 'NEW_TASK_START';
const NEW_TASK_SUCCESS = 'NEW_TASK_SUCCESS';
const NEW_TASK_FAILED = 'NEW_TASK_FAILED';

const CONFIG_IVIDEON_SUCCESS = 'CONFIG_IVIDEON_SUCCESS';
const CONFIG_IVIDEON_FAILED = 'CONFIG_IVIDEON_FAILED';

const CURRENT_PLAY_TIME_SET = 'CURRENT_PLAY_TIME_SET';
const CHECK_LIST_ID_SET = 'CHECK_LIST_ID_SET';
const DECLINE_MODAL_SHOW = 'DECLINE_MODAL_SHOW';
const FORMS_SAVE = 'FORMS_SAVE';
const SAVE_COUNTER_METRIC = 'SAVE_COUNTER_METRIC';
const SIDE_BAR_TOGGLE = 'SIDE_BAR_TOGGLE';

const CURRENT_CAMERA_SET = 'CURRENT_CAMERA_SET';
const NEW_TASK_SET = 'NEW_TASK_SET';
const TIME_TO_END_SET = 'TIME_TO_END_SET';

const WORK_END_START = 'WORK_END_START';
const WORK_END_SUCCESS = 'WORK_END_SUCCESS';
const WORK_END_FAILED = 'WORK_END_FAILED';

const DECLINE_WORK_START = 'DECLINE_WORK_START';
const DECLINE_WORK_SUCCESS = 'DECLINE_WORK_SUCCESS';
const DECLINE_WORK_FAILED = 'DECLINE_WORK_FAILED';

const CHECKLIST_SAVE_START = 'CHECKLIST_SAVE_START';
const CHECKLIST_SAVE_SUCCESS = 'CHECKLIST_SAVE_SUCCESS';
const CHECKLIST_SAVE_FAILED = 'CHECKLIST_SAVE_FAILED';

export const getLoadStart = () => dispatch => {
  dispatch(makeRequestApi({
    url: `${API_HOST}oper/start`,
    method: 'post',
    body: {},
    successType: DATA_SUCCESS,
    errorType: DATA_FAILED,
  }));
};

export const loadNewTask = afterSuccessLoadNewTask => dispatch => {
  dispatch(makeRequestApi({
    url: `${API_HOST}oper/work`,
    method: 'post',
    body: {},
    startType: NEW_TASK_START,
    successType: NEW_TASK_SUCCESS,
    errorType: NEW_TASK_FAILED,
    afterSuccess: afterSuccessLoadNewTask,
  }));
};

export const getConfigIvideon = afterSuccessConfigIvideon => dispatch => {
  dispatch(makeRequestApi({
    url: `${API_HOST}ivideon/token`,
    method: 'post',
    body: {},
    successType: CONFIG_IVIDEON_SUCCESS,
    errorType: CONFIG_IVIDEON_FAILED,
    afterSuccess: afterSuccessConfigIvideon,
  }));
};

export const workEndRequest = afterSuccessWorkEnd => dispatch => {
  dispatch(makeRequestApi({
    url: `${API_HOST}oper/done`,
    method: 'post',
    body: {},
    startType: WORK_END_START,
    successType: WORK_END_SUCCESS,
    errorType: WORK_END_FAILED,
    afterSuccess: afterSuccessWorkEnd,
  }));
};

export const requestDeclineWork = (value, afterSuccessDeclineWork) => dispatch => {
  dispatch(makeRequestApi({
    url: `${API_HOST}oper/decline`,
    method: 'post',
    body: {
      value,
    },
    startType: DECLINE_WORK_START,
    successType: DECLINE_WORK_SUCCESS,
    errorType: DECLINE_WORK_FAILED,
    afterSuccess: afterSuccessDeclineWork,
  }));
};

export const metricsSave = (metrics, type, afterSuccessSaveMetrics) => (dispatch, getState) => {
  const taskId = getState().operatorPage.taskData.task_info.task_id;
  const date = new Date(getState().operatorPage.currentPlayTime);
  let newMetrics = metrics;
  if (type === 5) {
    newMetrics = newMetrics.map(item => {
      item.time = date;
      return item;
    });
  }
  dispatch(makeRequestApi({
    url: `${API_HOST}oper/savechecklist`,
    method: 'post',
    body: {
      metrics: newMetrics,
      task_id: taskId,
    },
    startType: CHECKLIST_SAVE_START,
    successType: CHECKLIST_SAVE_SUCCESS,
    errorType: CHECKLIST_SAVE_FAILED,
    afterSuccess: afterSuccessSaveMetrics,
  }));

  if (type === 5) dispatch({ type: 'CLEAR_COUNTER_METRIC_ID', payload: metrics });
};

export const showDeclineModal = payload => ({
  type: DECLINE_MODAL_SHOW,
  payload,
});

export const sideBarToggle = () => ({
  type: SIDE_BAR_TOGGLE,
});

export const setCurrentPlayTime = payload => ({
  type: CURRENT_PLAY_TIME_SET,
  payload,
});

export const formsDataSave = payload => ({
  type: FORMS_SAVE,
  payload,
});

export const selectedChecklistIdSet = payload => ({
  type: CHECK_LIST_ID_SET,
  payload,
});

export const setCurrentCamera = payload => ({
  type: CURRENT_CAMERA_SET,
  payload,
});

export const setNewTask = (response, timeToEnd, currentPlayTime) => ({
  type: NEW_TASK_SET,
  response,
  timeToEnd,
  currentPlayTime,
});

export const timeToEndSet = timeToEnd => ({
  type: TIME_TO_END_SET,
  payload: timeToEnd,
});

export {
  SIDE_BAR_TOGGLE,
};
