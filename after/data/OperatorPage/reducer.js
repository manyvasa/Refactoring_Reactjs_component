const initialState = {
  data: {
    operator: {
      name: '',
    },
    day_summary: {
      all: '',
      done: '',
      overdue: '',
    },
    isEnd: true,
  },
  loader: false,
  sideBarShow: false,
  declineModalShow: false,
  workIsEnd: false,
  cameraRes: null,
  currentPlayTime: null,
  taskData: false,
  selectedChecklistId: false,
  counterMetric: {},
  timeToEnd: false,
  forms: {},
};

export default function loadStart(state = initialState, action) {
  switch (action.type) {
  case 'DATA_SUCCESS':
    return { ...state, ...{ data: action.payload }};

  case 'DATA_FAILED':
    return state;

  case 'NEW_TASK_START': {
    return { ...state, ...{ loader: true }};
  }

  case 'NEW_TASK_SUCCESS': {
    if (action.payload === 'Нет задач на сегодня') {
      return { ...state, ...{ workIsEnd: true, loader: false }};
    }
    return state;
  }

  case 'NEW_TASK_FAILED':
    return state;

  case 'CONFIG_IVIDEON_SUCCESS': {
    const camera = parseInt(localStorage.getItem('cameraId'), 10) || 0;
    return { ...state, ...{ cameraRes: action.payload, currentCamera: camera }};
  }

  case 'CONFIG_IVIDEON_FAILED':
    return state;

  case 'SIDE_BAR_TOGGLE':
    return { ...state, ...{ sideBarShow: !state.sideBarShow }};

  case 'DECLINE_MODAL_SHOW':
    return { ...state, ...{ declineModalShow: action.payload }};

  case 'CURRENT_PLAY_TIME_SET': {
    localStorage.setItem('currentPlayTime', action.payload);
    return { ...state, ...{ currentPlayTime: action.payload }};
  }

  case 'FORMS_SAVE': {
    const newforms = action.payload;
    const forms = Object.assign({}, state.forms, newforms);
    return { ...state, ...{ forms }};
  }

  case 'CHECK_LIST_ID_SET':
    return { ...state, ...{ selectedChecklistId: action.payload }};

  case 'CURRENT_CAMERA_SET':
    return { ...state, ...{ currentCamera: action.payload }};

  case 'TIME_TO_END_SET': {
    return { ...state, ...{ timeToEnd: action.payload }};
  }

  case 'SAVE_COUNTER_METRIC': {
    const metricId = action.metricId;
    const value = action.value;
    const counterMetric = Object.assign({}, state.counterMetric, {
      [metricId]: Number(value),
    });
    return { ...state, ...{ counterMetric }};
  }

  case 'CLEAR_COUNTER_METRIC_ID': {
    const metrics = action.payload;
    const counterMetric = Object.assign({}, state.counterMetric, {
      [metrics[0].metric_id]: '',
    });
    return { ...state, ...{ counterMetric }};
  }

  case 'NEW_TASK_SET': {
    return { ...state, ...{
      taskData: action.response,
      timeToEnd: action.timeToEnd,
      loader: false,
      workIsEnd: false,
      currentCamera: 0,
      currentPlayTime: action.currentPlayTime,
    }};
  }

  case 'WORK_END_START':
    return { ...state, ...{ loader: true }};

  case 'WORK_END_SUCCESS': {
    return { ...state, ...{
      loader: false,
      taskData: false,
      selectedChecklistId: false,
      currentCamera: false,
      counterMetric: {},
    }};
  }

  case 'WORK_END_FAILED':
    return { ...state, ...{ loader: false }};

  case 'DECLINE_WORK_START':
    return { ...state, ...{ loader: true }};

  case 'DECLINE_WORK_SUCCESS': {
    return { ...state, ...{
      data: action.payload,
      loader: false,
      taskData: false,
      selectedChecklistId: false,
      currentCamera: false,
      counterMetric: {},
    }};
  }

  case 'DECLINE_WORK_FAILED':
    return { ...state, ...{ loader: false }};

  case 'CHECKLIST_SAVE_START': {
    return { ...state, ...{ loader: true }};
  }

  case 'CHECKLIST_SAVE_SUCCESS': {
    const taskChecklistsObj = (action.payload.task_checklists)
      ? { task_checklists: action.payload.task_checklists } : {}; // TODO: Remove this check when the backend response will be right.

    const taskData = Object.assign({}, state.taskData, taskChecklistsObj);
    return { ...state, ...{ taskData }, ...{ loader: false }};
  }

  case 'CHECKLIST_SAVE_FAILED':
    return state;

  default:
    return state;
  }
}
