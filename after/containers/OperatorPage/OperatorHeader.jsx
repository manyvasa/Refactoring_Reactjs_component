import React from 'react';
import { connect } from 'react-redux';
import { Button } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import {
  getLoadStart,
  loadNewTask,
  requestDeclineWork,
  setNewTask,
  timeToEndSet,
  showDeclineModal,
  sideBarToggle,
} from 'data/OperatorPage/actions';
import Header from 'components/Header';
import HeaderPointInfo from 'components/OperatorPage/HeaderPointInfo';
import HeaderTopPanel from 'components/OperatorPage/HeaderTopPanel';
import DeclineModal from 'components/OperatorPage/DeclineModal';

class OperatorHeader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};

    this.declineWork = this.declineWork.bind(this);
    this.onTaskLoaded = this.onTaskLoaded.bind(this);
    this.prepareForms = this.prepareForms.bind(this);
    this.checkLocalData = this.checkLocalData.bind(this);
    this.checkUnfinished = this.checkUnfinished.bind(this);
    this.stopIntervalTimeToEnd = this.stopIntervalTimeToEnd.bind(this);
    this.afterSuccessDeclineWork = this.afterSuccessDeclineWork.bind(this);
  }

  componentDidMount() {
    const { loadStart } = this.props;

    loadStart();
  }

  componentWillReceiveProps(nextProps) {
    if (!nextProps.taskData && this.setTimes) {
      const { loadStart } = this.props;

      this.stopIntervalTimeToEnd();
      loadStart();
    }
  }

  checkLocalData(currentTaskId) {
    const localTaskId = parseInt(localStorage.getItem('taskId'), 10);

    if (currentTaskId !== localTaskId) {
      localStorage.setItem('taskId', currentTaskId);
      localStorage.setItem('currentPlayTime', '');
      localStorage.setItem('cameraId', '');
      localStorage.setItem('forms', '');
    }
  }

  stopIntervalTimeToEnd() {
    clearInterval(this.setTimes);
    delete this.setTimes;
  }

  prepareForms() {
    const { taskData, onSaveForms } = this.props;

    const checklists = taskData.task_checklists;
    const forms = {};

    function metricsToObjct(metrics) {
      const obj = {};

      metrics.forEach(e => {
        e.form = {
          value: true,
          comment: '',
          date_from: '',
          camera_id: '',
        }; // an empty form for check metrics
        obj[e.id] = e;
      });

      return obj;
    }

    checklists.forEach(e => {
      const metrics = metricsToObjct(e.metrics);

      forms[e.metric_id] = metrics;
    });

    onSaveForms(forms);
  }

  afterSuccessDeclineWork() {
    const { onSetTimeToEnd } = this.props;

    this.stopIntervalTimeToEnd();
    onSetTimeToEnd(false);
  }

  declineWork(value) {
    const { onDeclineWork } = this.props;

    onDeclineWork(value, this.afterSuccessDeclineWork);
  }

  checkUnfinished() {
    const localData = localStorage.getItem('forms');

    let answer = false;

    if (localData) {
      // eslint-disable-next-line
      answer = confirm('Обнаружена не законченная форма, хоти продолжить заполнение?');
    }

    if (answer) {
      const forms = JSON.parse(localData);
      const { onSaveForms } = this.props;

      onSaveForms(forms);
    } else {
      localStorage.removeItem('forms');
    }
  }

  onTaskLoaded({ response }) {
    if (response !== 'Нет задач на сегодня') {
      let timeToEnd = new Date(response.task_info.deadline).valueOf() - new Date().valueOf();
      timeToEnd = `${(timeToEnd / 1000 / 60).toFixed()} мин.`;
      this.setTimes = setInterval(() => {
        const { taskData } = this.props;

        if (taskData) {
          const { onSetTimeToEnd } = this.props;
          let teakTimeToEnd = new Date(taskData.task_info.deadline).valueOf() - new Date().valueOf();
          teakTimeToEnd = `${(teakTimeToEnd / 1000 / 60).toFixed()} мин.`;
          onSetTimeToEnd(teakTimeToEnd);
        }
      }, 60000);

      const taskId = response.task_info.task_id;
      const { onSetNewTask } = this.props;

      this.checkLocalData(taskId);

      const currentPlayTime = parseFloat(localStorage.getItem('currentPlayTime'));
      onSetNewTask(response, timeToEnd, currentPlayTime);

      this.prepareForms();
      this.checkUnfinished();
    }
  }

  render() {
    const {
      data,
      taskData,
      sideBarShow,
      toggleSideBar,
      loader,
      workIsEnd,
      loadNewTask,
      showDeclineModal,
      declineModalShow,
    } = this.props;
    const options = {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    };
    const clientName = taskData ? taskData.task_info.client_name : '';
    const clientPoint = taskData ? taskData.task_info.point_name : '';
    const reportDate = taskData ? new Date(taskData.task_info.report_date).toLocaleString('ru', options) : '';
    const timeToEnd = this.props.timeToEnd ? this.props.timeToEnd : '';

    return (
      <Header
        icon={sideBarShow ? 'cancel' : 'content'}
        toggleSideBar={toggleSideBar}
      >
        <HeaderPointInfo
          loader={loader}
          clientName={clientName}
          clientPoint={clientPoint}
          reportDate={reportDate}
          timeToEnd={timeToEnd}
        />
        <div className="header__divider" />
        <div className="top-panel">
          <HeaderTopPanel
            user={data.operator.name}
            all={data.day_summary.all}
            done={data.day_summary.done}
            overdue={data.day_summary.overdue}
          />
          <div>
            {workIsEnd === true
            && (
              <div>
              В данное время задачи отсутствуют
              </div>
            )
            }
            {taskData === false
            && (
              <Button
                size="small"
                color={data.isEnd ? 'blue' : 'green'}
                onClick={() => loadNewTask(this.onTaskLoaded)}
              >
                {data.isEnd ? 'Взять задачу' : 'Продолжить задачу'}
              </Button>
            )
            }
            {taskData !== false
            && (
              <Button
                color="red"
                size="small"
                onClick={() => showDeclineModal(true)}
              >
              Отказаться от задачи
              </Button>
            )
            }
          </div>
        </div>
        {declineModalShow
        && (
          <DeclineModal
            show={declineModalShow}
            onClose={() => showDeclineModal(false)}
            onSubmit={value => {
              this.declineWork(value);
              showDeclineModal(false);
            }}
          />
        )
        }
      </Header>
    );
  }
}

OperatorHeader.propTypes = {
  loadStart: PropTypes.func.isRequired,
  loadNewTask: PropTypes.func.isRequired,
  onDeclineWork: PropTypes.func.isRequired,
  onSaveForms: PropTypes.func.isRequired,
  showDeclineModal: PropTypes.func.isRequired,
  onSetNewTask: PropTypes.func.isRequired,
  onSetTimeToEnd: PropTypes.func.isRequired,
  toggleSideBar: PropTypes.func.isRequired,
  loader: PropTypes.bool.isRequired,
  workIsEnd: PropTypes.bool.isRequired,
  sideBarShow: PropTypes.bool.isRequired,
  declineModalShow: PropTypes.bool.isRequired,
  timeToEnd: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.string,
  ]).isRequired,
  taskData: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]).isRequired,
  data: PropTypes.shape({
    operator: PropTypes.object.isRequired,
    day_summary: PropTypes.object.isRequired,
    isEnd: PropTypes.bool.isRequired,
  }).isRequired,
};

const mapStateToProps = state => state.operatorPage;

const mapDispatchToProps = dispatch => ({

  loadStart: () => dispatch(getLoadStart()),

  onDeclineWork: (value, afterSuccessDeclineWork) => {
    dispatch(requestDeclineWork(value, afterSuccessDeclineWork));
  },

  loadNewTask: afterSuccessLoadNewTask => {
    dispatch(loadNewTask(afterSuccessLoadNewTask));
  },

  toggleSideBar: () => dispatch(sideBarToggle()),

  onSetNewTask: (response, timeToEnd, currentPlayTime) => {
    dispatch(setNewTask(response, timeToEnd, currentPlayTime));
  },

  onSetTimeToEnd: timeToEnd => {
    dispatch(timeToEndSet(timeToEnd));
  },

  showDeclineModal: bool => dispatch(showDeclineModal(bool)),

});

export default connect(mapStateToProps, mapDispatchToProps)(OperatorHeader);
