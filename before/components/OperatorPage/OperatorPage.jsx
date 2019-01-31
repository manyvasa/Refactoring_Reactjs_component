import React, {Component} from 'react';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import SideBar from './../SideBar';
// import LocalPlayer from './LocalPlayer';
import { Button, Icon, Table, Radio, Header, TextArea, Form, Dimmer, Loader, Select, Input } from 'semantic-ui-react';
import { makeRequest } from './../../utils/network';
import { cloneDeep, isEqual } from 'lodash';
import { clearStorage } from './../../utils/auntificate';
import Datetime from 'react-datetime';
import DeclineModal from './DeclineModal';
import AppConfig from './../../configs/AppConfig';

const API_HOST = AppConfig[process.env.NODE_ENV].API_HOST;

function saveUntilBackendIsBroken(task_id, newMetrics) {
  return makeRequest(`${API_HOST}oper/savechecklist`, {
    method: 'post',
    body: {
      metrics: newMetrics,
      task_id,
    },
  }, localStorage)
    .then(res => {
      if (typeof res.task_checklists === "undefined") {
        alert('Не удалось сохранить. Для повторной отправки нажмите ОК');

        setTimeout(() => {
          return saveUntilBackendIsBroken(task_id, newMetrics);
        }, 1000);
      }

      return Promise.resolve(res);
    })
    .catch(e => {
      if (e.message === 'Unauthorized') {
        clearStorage(localStorage);
        this.props.history.push('/');
      }

      return Promise.reject();
    });
}

export default class OperatorPage extends React.Component {
  constructor() {
    super();
    this.state = {
      padding: 24,
      sideBarShow: false,
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
      taskData: false,
      selectedChecklistId: false,
      counterMetric: {},
      loader: false,
      declineModalShow: false,
      workIsEnd: false,
      currentCamera: false,
      currentPlayTime: null,
      isLocalPlayer: false,
      forms: {},
      cameraRes: null,
    };
    this.defaultBoxStyle = {
      boxShadow: '0px 0px 3px 0px rgba(0, 0, 0, .4)',
      borderRadius: 5,
      width: '100%',
      padding: 16,
    };
    this.forms = [];
    this.makeIframePlayer = this.makeIframePlayer.bind(this);
    this.onChangeTab = this.onChangeTab.bind(this);
    this.changeCurrentTime = this.changeCurrentTime.bind(this);
    this.radioHandler = this.radioHandler.bind(this);
    this.dateTimeHandler = this.dateTimeHandler.bind(this);
    this.renderPointInfo = this.renderPointInfo.bind(this);
    this.renderTopPanel = this.renderTopPanel.bind(this);
    this.prepareForms = this.prepareForms.bind(this);
    this.events = this.events.bind(this);
    this.saveForms = this.saveForms.bind(this);
    this.restartPlayer = this.restartPlayer.bind(this);
    this.checkUnfinished = this.checkUnfinished.bind(this);
    this.checkLocalData = this.checkLocalData.bind(this);

    this.loadNewTask = this.loadNewTask.bind(this);
    this.loadStart = this.loadStart.bind(this);
    this.prepareMetrics = this.prepareMetrics.bind(this);
    this.buildTree = this.buildTree.bind(this);
    this.prepareArray = this.prepareArray.bind(this);
    this.formCancel = this.formCancel.bind(this);
    this.resetForm = this.resetForm.bind(this);
    this.formSubmit = this.formSubmit.bind(this);
    this.saveMetrics = this.saveMetrics.bind(this);
    this.workEnd = this.workEnd.bind(this);
    this.declineWork = this.declineWork.bind(this);
    this.playVideo = this.playVideo.bind(this);
    this.loadConfigIvideon = this.loadConfigIvideon.bind(this);
    this.onChangeCamera = this.onChangeCamera.bind(this);
  }

  componentDidMount() {
    localStorage.setItem('isSmartmetricsTeam', 'true');

    this.loadStart();

    window.addEventListener('changeCurrentTime', this.changeCurrentTime);
  }

  componentWillUnmount() {
    clearInterval(this.setTimes);
    if (this.player !== undefined) {
      this.player.destroy();
    }

    window.removeEventListener('changeCurrentTime', this.changeCurrentTime);
  }

  onChangeTab(index) {
    if (index === 0) {
      this.loadConfigIvideon();
    }
    if (index === 1 && this.player !== undefined) {
      this.player.destroy();
      delete this.player;
    }

    this.state.isLocalPlayer = !!index; // Current tab is 1 so it is a local player
  }

  changeCurrentTime(e) {
    const localPlayerTime = e.detail;

    if (localPlayerTime > 0) {
      localStorage.setItem('currentPlayTime', localPlayerTime);
      this.state.currentPlayTime = localPlayerTime;
    }
  }

  events(event) {
    const ivideonUnix = event.sender._cameraVideoView._playheadTime;

    if (ivideonUnix > 0) {
      localStorage.setItem('currentPlayTime', ivideonUnix);
      this.setState({ currentPlayTime: ivideonUnix });
    }
  }

  saveForms(forms) {
    this.setState({ forms });

    localStorage.setItem('forms', JSON.stringify(forms));
  }

  checkUnfinished() {
    const localData = localStorage.getItem('forms');

    let answer = false;

    if (localData) {
      answer = confirm("Обнаружена не законченная форма, хоти продолжить заполнение?");
    }

    if (answer) {
      this.setState({ forms: JSON.parse(localData) });
    } else {
      localStorage.setItem('forms', '');
    }

    this.setState({ forms });

  }

  checkLocalData(currentTaskId) {
    const localTaskId = parseInt(localStorage.getItem('taskId'));

    if (currentTaskId !== localTaskId) {
      localStorage.setItem('taskId', currentTaskId);
      localStorage.setItem('currentPlayTime', '');
      localStorage.setItem('cameraId', '');
      localStorage.setItem('forms', '');
    }
  }

  prepareForms() {
    const checklists = this.state.taskData.task_checklists;
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
      // const form = buildEmptyFormForMetrics(e.metrics);
      const metrics = metricsToObjct(e.metrics);

      forms[e.metric_id] = metrics;
    });

    this.setState({ forms });
  }

  makeIframePlayer() {
    const token = localStorage.getItem('smartUserToken');
    const task_id = (this.state.taskData.task_info && this.state.taskData.task_info.task_id)
      ?  this.state.taskData.task_info.task_id : false;

    if (!task_id) return null;

    return (
      <iframe
        className="local-player-iframe"
        title="Local Player"
        src={`/iframe/?task_id=${task_id}&camera=${this.state.currentCamera}&time=${this.state.currentPlayTime}&token=${token}`}
        frameBorder="0"
      />
    );
  }

  loadConfigIvideon() {
    makeRequest(`${API_HOST}ivideon/token`, {
      method: 'post',
    }, localStorage)
      .then(res => {
        const camera = parseInt(localStorage.getItem('cameraId')) || 0;

        this.setState({ cameraRes: res, currentCamera: camera });
        this.playVideo(res, camera);
      })
      .catch(e => {
        if (e.message === 'Unauthorized') {
          clearStorage(localStorage);
          this.props.history.push('/');
        }
      });
  }

  loadStart() {
    makeRequest(`${API_HOST}oper/start`, {
      method: 'post',
      body: {},
    }, localStorage)
      .then(res => {
        this.setState({ data: res });
      })
      .catch(e => {
        if (e.message === 'Unauthorized') {
          clearStorage(localStorage);
          this.props.history.push('/');
        }
      });
  }

  loadNewTask() {
    this.setState({ loader: true });
    makeRequest(`${API_HOST}oper/work`, {
      method: 'post',
      body: {},
    }, localStorage)
      .then(res => {
        if (res === 'Нет задач на сегодня') {
          this.setState({ workIsEnd: true, loader: false });
        } else {
          let timeToEnd = new Date(res.task_info.deadline).valueOf() - new Date().valueOf();
          timeToEnd = `${(timeToEnd / 1000 / 60).toFixed()} мин.`;
          this.setTimes = setInterval(() => {
            if (this.state.taskData) {
              let timeToEnd = new Date(this.state.taskData.task_info.deadline).valueOf() - new Date().valueOf();
              timeToEnd = `${(timeToEnd / 1000 / 60).toFixed()} мин.`;
              this.setState({ timeToEnd });
            }
          }, 60000);

          const taskId = res.task_info.task_id

          this.checkLocalData(taskId);
          this.loadConfigIvideon();

          const currentPlayTime = parseFloat(localStorage.getItem('currentPlayTime'));

          this.setState({ taskData: res, timeToEnd, loader: false, workIsEnd: false, currentCamera: 0, currentPlayTime });

          this.prepareForms();
          this.checkUnfinished();
        }
      })
      .catch(e => {
        if (e.message === 'Unauthorized') {
          clearStorage(localStorage);
          this.props.history.push('/');
        }
      });
  }

  workEnd() {
    if (this.player !== undefined) {
      this.player.destroy();
    }
    this.setState({ loader: true });
    makeRequest(`${API_HOST}oper/done`, {
      method: 'post',
      body: {},
    }, localStorage)
      .then(res => {
        clearInterval(this.setTimes);
        this.setState({
          loader: false,
          taskData: false,
          timeToEnd: false,
          selectedChecklistId: false,
          currentCamera: false,
          counterMetric: {},
        });
        this.loadStart();
      })
      .catch(e => {
        if (e.message === 'Unauthorized') {
          clearStorage(localStorage);
          this.props.history.push('/');
        }
      });
  }

  restartPlayer() {
    if (this.player !== undefined) {
      this.player.destroy();
      delete this.player;
    }

    this.loadConfigIvideon();
  }

  declineWork(value) {
    if (this.player !== undefined) {
      this.player.destroy();
    }
    this.setState({ loader: true });
    makeRequest(`${API_HOST}oper/decline`, {
      method: 'post',
      body: {
        value,
      },
    }, localStorage)
      .then(res => {
        clearInterval(this.setTimes);
        this.setState({
          data: res,
          loader: false,
          taskData: false,
          timeToEnd: false,
          selectedChecklistId: false,
          currentCamera: false,
          counterMetric: {},
        });
      })
      .catch(e => {
        if (e.message === 'Unauthorized') {
          clearStorage(localStorage);
          this.props.history.push('/');
        }
      });
  }

  topButtons() {
    return (
      <div>
        {this.state.workIsEnd === true &&
        <div>
          В данное время задачи отсутствуют
        </div>
        }
        {this.state.taskData === false &&
        <Button
          size="small"
          color={this.state.data.isEnd ? 'blue' : 'green'}
          onClick={() => this.loadNewTask()}
        >
          {this.state.data.isEnd ? 'Взять задачу' : 'Продолжить задачу'}
        </Button>
        }
        {this.state.taskData !== false &&
        <Button
          color="red"
          size="small"
          onClick={() => this.setState({declineModalShow: true})}
        >
          Отказаться от задачи
        </Button>
        }
      </div>
    );
  }

  renderTopPanel(data) {
    return (
      <div className="top-panel">
        <div className="top-panel__inner">
          <div className="top-panel__item">
            <Icon size="large" color="blue" name="user"/>
            <span>{data.operator.name}</span>
          </div>
          <div className="top-panel__centered">
            <div className="top-panel__item">
              <Icon size="large" color="blue" name="ordered list"/>
              <span>{data.day_summary.all}</span>
            </div>
            <div className="top-panel__item">
              <Icon size="large" color="green" name="checkmark"/>
              <span>{data.day_summary.done}</span>
            </div>
            <div className="top-panel__item">
              <Icon size="large" color="red" name="dont"/>
              <span>{data.day_summary.overdue}</span>
            </div>
          </div>
        </div>
        { this.topButtons() }
      </div>
    );
  }

  renderPointInfo(clientName, clientPoint, report_date, timeToEnd, cameraOptions) {
    if(!clientPoint && !clientName && !report_date && !timeToEnd) return null;

    return (
      <div className="point-info">
        <Dimmer
          active={this.state.loader}
          inverted
        >
          <Loader inverted/>
        </Dimmer>
        <div className="point-info__inner">
          <div className="point-info__item">
            <Icon size="large" name="user"/>
            <span>{clientName}</span>
          </div>
          <div className="point-info__item">
            <Icon size="large" name="map pin"/>
            <span>{clientPoint}</span>
          </div>
          <div className="point-info__item">
            <Icon size="large" name="clock"/>
            <span>{report_date}</span>
          </div>
          <div className="point-info__item">
            <Icon size="large" name="clock"/>
            <span>{timeToEnd}</span>
          </div>
        </div>
      </div>
    );
  }

  dateTimeHandler(checklistId, metricId, date) {
    const forms = this.state.forms;

    forms[checklistId][metricId].form.date_from = date._d;

    this.saveForms(forms)
  }

  radioHandler(checklistId, metricId, value) {
    const forms = this.state.forms;

    let date = null;
    let currentCameraId = null;

    if (!value) {
      const currentCamera = this.state.currentCamera;
      date = this.state.currentPlayTime;
      currentCameraId = this.state.taskData.task_info.cameras[currentCamera].camera_id;
    }

    forms[checklistId][metricId].form = {
      value,
      comment: '',
      date_from: date,
      camera_id: currentCameraId,
    };

    this.saveForms(forms);
  }

  buildTree(arr) {

    function getDate (date) {
      if(typeof date === "string") {
        return new Date(date);
      }

      return date;
    }

    if (arr.length === 0) { return; }
    return arr.map(item => {
      const metricId = item.id;
      const name = item.name;
      const description = item.description;
      const children = item.children;
      const isEnd = children.length === 0;
      if (isEnd && this.forms.indexOf(metricId) === -1) {
        this.forms = [...this.forms, metricId];
      }

      const checklistId = this.state.selectedChecklistId;
      const check = this.state.forms[checklistId][metricId].form;

      if (isEnd) {
        return (
          <div
            key={name}
            style={{
              marginLeft: 16,
              marginBottom: 12,
            }}
          >
            <Table
              celled
              style={{
                fontSize: 14,
                fontWeight: 'normal',
              }}
            >
              <Table.Body>
                <Table.Row>
                  <Table.Cell verticalAlign="top">{name}</Table.Cell>
                  <Table.Cell verticalAlign="top" collapsing>
                    <label style={{ marginLeft: 20 }}>да</label>
                    <Radio
                      style={{ marginLeft: 10 }}
                      checked={check && check.value === true}
                      onChange={() => this.radioHandler(checklistId, metricId, true)}
                    />
                  </Table.Cell>
                  <Table.Cell verticalAlign="top" collapsing>
                    <label style={{ marginLeft: 20 }}>нет</label>
                    <Radio
                      style={{ marginLeft: 10 }}
                      checked={check && check.value === false}
                      onChange={() => this.radioHandler(checklistId, metricId, false)}
                    />
                  </Table.Cell>
                </Table.Row>
                {check && check.value === false &&
                <Table.Row>
                  <Table.Cell colSpan="3">
                    <Form>
                      <Form.Group style={{ margin: 0 }}>
                        <Form.Field style={{ display: 'flex', alignItems: 'center' }}>
                          <label style={{ marginRight: 8 }}>Время:</label>
                          <Datetime
                            value={getDate(check.date_from)}
                            locale="ru"
                            dateFormat={false}
                            timeFormat={'HH:mm:ss'}
                            onChange={date => this.dateTimeHandler(checklistId, metricId, date)}
                            closeOnSelect
                          />
                        </Form.Field>
                      </Form.Group>
                    </Form>
                  </Table.Cell>
                </Table.Row>
                }
              </Table.Body>
            </Table>
          </div>
        );
      }
      return (
        <div
          key={name}
          style={{
            marginBottom: 16,
            fontSize: 16,
            fontWeight: 'bold',
          }}
        >
          <div>{name}</div>
          <div>{description}</div>
          {this.buildTree(children)}
        </div>
      );
    });
  }

  prepareArray(arr, ind) {
    if (arr.filter(item => item.parent_id === ind).length === 0) { return []; }
    const currentArray = arr.filter(item => item.parent_id === ind);
    const endArray = currentArray.reduce((acc, el) => {
      const elem = {
        id: el.id,
        name: el.name,
        description: el.description,
        children: this.prepareArray(arr, el.id),
        order: el.order,
      };
      acc.push(elem);
      return acc;
    }, []);
    return endArray.sort((a, b) => a.order - b.order);
  }

  prepareMetrics(id) {
    const currentMetric = this.state.taskData.task_checklists.find(item => item.metric_id === id);
    const metrics = this.prepareArray(currentMetric.metrics, id);
    return (this.buildTree(metrics));
  }

  resetForm() {
    const forms = this.state.forms;

    const checklist = forms[this.state.selectedChecklistId];

    Object.keys(checklist).forEach(e => {
      checklist[e].form.value = true;
    });

    forms[this.state.selectedChecklistId] = checklist;

    this.setState({ forms });
    localStorage.setItem('forms', '');
  }

  formCancel() {
    this.forms = [];

    this.setState({ selectedChecklistId: false });
  }

  saveMetrics(metrics, type) {
    const task_id = this.state.taskData.task_info.task_id;
    const date = new Date(this.state.currentPlayTime);
    let newMetrics = metrics;
    if (type === 5) {
      newMetrics = newMetrics.map(item => {
        item.time = date;
        return item;
      });
    }

    this.setState({ loader: true });

    saveUntilBackendIsBroken(task_id, newMetrics)
      .then(res => {
        this.setState({
          loader: false,
          taskData: Object.assign({}, this.state.taskData, {
            task_checklists: res.task_checklists,
          }),
        });
        if (type === 5) {
          this.setState({
            counterMetric: Object.assign({}, this.state.counterMetric, {
              [metrics[0].metric_id]: '',
            }),
          });
        }

        this.resetForm();
        this.formCancel();
      })
      .catch(() => {
        this.resetForm();
        this.formCancel();
      });
  }

  formSubmit() {
    const checklist = this.state.forms[this.state.selectedChecklistId];

    const metrics = Object.keys(checklist).map(key => {
      const form = checklist[key].form;

      const metric_id = key;
      let value = 1;
      const comment = form.comment;
      let date_from = form.date_from;
      const camera_id = form.camera_id || '';
      if (form.value === false) {
        value = 2;
      } else if (form.value === 'other') {
        value = 3;
      }
      if (value === 2 || value === 3) {
        date_from = new Date(date_from).toISOString();
      }
      return {
        metric_id,
        value,
        comment,
        date_from,
        camera_id,
      };
    });
    this.saveMetrics(metrics);
  }

  playVideo(res, camera, dateStart) {
    const date = dateStart || this.state.taskData.task_info.report_date;
    const currentCamera = this.state.taskData.task_info.cameras[camera || this.state.currentCamera];
    const camera_id = currentCamera.camera_id;
    const camera_width = currentCamera.width;
    const camera_height = currentCamera.height;

    _ivideon.sdk.init({
      rootUrl: 'ivideon-web-sdk-0.17.0/',
      i18nOptions: {
        availableLanguages: [
          'ru',
        ],
        language: 'ru',
      },
    })
      .then(sdk => {
        this.sdk = sdk;
        res.api_host = 'https://streaming.ivideon.com';
        this.sdk.configureWithCloudApiAuthResponse(res);
        const camera = this.sdk.createCamera({
          id: camera_id,
          imageWidth: 400,
          imageHeight: 200,
          cameraName: 'IP Camera',
        });
        this.player = this.sdk.createPlayer({
          container: '#smartPlayer',
          camera,
          defaultControls: { playPauseButtonEnabled: 1 },
        });

        const startTime = this.state.currentPlayTime && this.state.currentPlayTime > 0 ?
          this.state.currentPlayTime :
          new Date(date).valueOf();

        this.player.playArchive({
          startTime,
          // "startTime": new Date().valueOf()
        });

        this.sdk.getDispatcher().subscribe(event => this.events(event));
      }).then(() => {
        document.querySelector('.iv-timeline-center-button').click();
    });
  }

  onChangeCamera(value) {
    const date = (this.player) ? new Date(this.player._cameraVideoView._playheadTime) : null;

    if (this.player !== undefined) {
      this.player.destroy();
    }

    this.setState({ currentCamera: value });

    localStorage.setItem('cameraId', value);

    if (!this.state.isLocalPlayer) {
      this.playVideo(this.state.cameraRes, value, date);
    }
  }

  render() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const width = document.body.clientWidth;
    const data = this.state.data;
    const taskData = this.state.taskData;
    const check_lists = taskData ? taskData.task_checklists : [];
    const clientName = taskData ? taskData.task_info.client_name : '';
    const clientPoint = taskData ? taskData.task_info.point_name : '';
    const report_date = taskData ? new Date(taskData.task_info.report_date).toLocaleString('ru', options) : '';
    const timeToEnd = this.state.timeToEnd ? this.state.timeToEnd : '';
    const videoHeight = document.body.clientHeight - 428;
    const cameraOptions = taskData
      ? taskData.task_info.cameras.map((item, i) => ({
        text: item.name,
        value: i,
      }))
      : [];
    let isWorkEnd = true;
    check_lists.forEach(item => {
      if (item.to_do !== item.done && item.type !== 3 && item.type !== 4 && item.type !== 5) {
        isWorkEnd = false;
      }
    });
    if (check_lists.length === 0) {
      isWorkEnd = false;
    }

    return (
      <main className="operator">
        <SideBar
          icon={this.state.sideBarShow ? 'cancel' : 'content'}
          onShowChange={() => {
            this.setState({sideBarShow: !this.state.sideBarShow});
          }}
        >
          { this.renderPointInfo(clientName, clientPoint, report_date, timeToEnd, cameraOptions) }
          <div className="header__divider" />
          { this.renderTopPanel(data) }
        </SideBar>
        <div className="operator__container">
          <Dimmer
            active={this.state.loader}
            inverted
          >
            <Loader inverted/>
          </Dimmer>

          { this.state.taskData &&

            <div className="operator__content">
              <div className="operator__left left-side">
                <div className="left-side__tabs tabs-flex-wrapper">
                  <div className="camera-select">
                    <Button
                      className="restart-button"
                      color="blue"
                      size="small"
                      onClick={this.restartPlayer}>
                      Перезагрузить плеер
                    </Button>

                    <label>
                      Камера:
                    </label>
                    <Select
                      options={cameraOptions}
                      value={this.state.currentCamera}
                      onChange={(e, select) => this.onChangeCamera(select.value)}
                    />
                  </div>

                  <Tabs onSelect={this.onChangeTab}>
                    <TabList>
                      <Tab>Ivideon</Tab>
                      <Tab>Локальный</Tab>
                    </TabList>

                    <TabPanel>
                      <div id="smartPlayer"/>
                    </TabPanel>
                    <TabPanel>
                      {this.makeIframePlayer()}
                    </TabPanel>
                  </Tabs>
                </div>
              </div>
              <div className="operator__right right-side">
                <div className="checklists">
                  {this.state.selectedChecklistId !== false &&
                  this.prepareMetrics(this.state.selectedChecklistId)
                  }
                  {this.state.selectedChecklistId !== false &&
                  <div
                    style={{position: 'fixed', bottom: 40, right: 40}}
                  >
                    <Button
                      onClick={() => this.formCancel()}
                    >Назад</Button>
                    <Button
                      style={{marginLeft: 16}}
                      color="blue"
                      onClick={() => this.formSubmit()}
                    >Отправить</Button>
                  </div>
                  }
                  <div>
                    {this.state.selectedChecklistId === false && check_lists.map((metric, i) => {
                      let count = metric.count || 0;
                      let isChanged = false;
                      const name = metric.name;
                      const type = metric.type;
                      const metric_id = metric.metric_id;
                      const done = metric.done;
                      const to_do = metric.to_do;
                      if (this.state.counterMetric[metric_id] !== undefined) {
                        count = this.state.counterMetric[metric_id];
                        if (count !== metric.count) {
                          isChanged = true;
                        }
                      }
                      if (type === 5) {
                        count = this.state.counterMetric[metric_id] || '';
                      }
                      if (type !== 3 && type !== 4 && type !== 5) {
                        return (
                          <div
                            key={metric_id}
                            style={Object.assign({}, this.defaultBoxStyle, {
                              height: 50,
                              marginTop: i === 0 ? 0 : 16,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            })}
                          >
                            <span style={{fontSize: 16}}>{name}</span>
                            <div
                              style={{
                                width: 200,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <span>{`${done} из ${to_do}`}</span>
                              {done !== to_do &&
                              <Button
                                style={{marginLeft: 32}}
                                color="blue"
                                onClick={() => {
                                  this.setState({selectedChecklistId: metric_id});
                                }}
                              >Начать</Button>
                              }
                              {done === to_do &&
                              <Icon
                                style={{marginLeft: 32}}
                                size="large"
                                color="green"
                                name="checkmark"
                              />
                              }
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div
                          key={metric_id}
                          style={Object.assign({}, this.defaultBoxStyle, {
                            height: 50,
                            marginTop: i === 0 ? 0 : 16,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          })}
                        >
                          <span style={{fontSize: 16, marginRight: 10}}>{name}</span>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                              }}
                            >
                              <Input
                                value={count}
                                type="number"
                                onChange={(e, data) => {
                                  if (data.value >= 0) {
                                    this.setState({
                                      counterMetric: Object.assign({}, this.state.counterMetric, {
                                        [metric_id]: Number(data.value),
                                      }),
                                    });
                                  }
                                }}
                              />
                              {type !== 5 &&
                              <div className="nowrap">
                                <Icon
                                  style={{cursor: 'pointer', marginLeft: 8}}
                                  size="large"
                                  color="red"
                                  name="minus"
                                  onClick={() => {
                                    if (count > 0) {
                                      this.setState({
                                        counterMetric: Object.assign({}, this.state.counterMetric, {
                                          [metric_id]: count - 1,
                                        }),
                                      });
                                    }
                                  }}
                                />
                                <Icon
                                  style={{cursor: 'pointer'}}
                                  size="large"
                                  color="green"
                                  name="plus"
                                  onClick={() => {
                                    this.setState({
                                      counterMetric: Object.assign({}, this.state.counterMetric, {
                                        [metric_id]: count + 1,
                                      }),
                                    });
                                  }}
                                />
                              </div>
                              }
                            </div>
                            <div
                              style={{display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 120}}
                            >
                              {isChanged && type !== 5 &&
                              <Button
                                style={{}}
                                color="blue"
                                onClick={() => {
                                  const metrics = [{
                                    metric_id,
                                    count,
                                  }];
                                  this.saveMetrics(metrics, type);
                                }}
                              >Отправить</Button>
                              }
                              {!isChanged && type !== 5 &&
                              <Icon
                                size="large"
                                color="green"
                                name="checkmark"
                              />
                              }
                              {type === 5 && count !== '' &&
                              <Button
                                style={{marginLeft: 24}}
                                color="blue"
                                onClick={() => {
                                  const metrics = [{
                                    metric_id,
                                    count,
                                  }];
                                  this.saveMetrics(metrics, type);
                                }}
                              >Отправить</Button>
                              }
                              {type === 5 && count === '' &&
                              <Icon
                                size="large"
                                color="green"
                                name="checkmark"
                              />
                              }
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {isWorkEnd && this.state.selectedChecklistId === false &&
                    <Button
                      style={{position: 'absolute', bottom: 16, right: 16}}
                      color="blue"
                      onClick={() => this.workEnd()}
                    >Закончить задачу</Button>
                    }
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
        <div
          style={{
            height: 'calc(100vh - 48px)',
            position: 'fixed',
            left: 0,
            top: 48,
            width: '100vw',
            display: this.state.sideBarShow ? 'flex' : 'none',
            zIndex: 9,
          }}
        >
          <div
            style={{
              width: 250,
              backgroundColor: '#fff',
              boxShadow: '0px 0px 8px 0px #00A1F1',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div/>
            <div
              style={{
                width: '100%',
                height: 40,
                marginTop: 20,
                display: 'flex',
                alignItems: 'center',
                borderBottom: '1px solid #00A1F1',
                cursor: 'pointer',
              }}
              onClick={() => {
                clearStorage(localStorage);
                this.props.history.push('/');
              }}
            >
              <Icon
                style={{marginLeft: 16}}
                name="power"
                size="large"
                color="blue"
              />
              <span style={{marginLeft: 8, fontSize: 16}}>Выйти</span>
            </div>
          </div>
          <div
            style={{
              width: 'calc(100vw - 250px)',
              backgroundColor: 'rgba(0, 0, 0, .6)',
              height: '100%',
            }}
            onClick={() => {
              this.setState({sideBarShow: false});
            }}
          />
        </div>
        {this.state.declineModalShow &&
        <DeclineModal
          show={this.state.declineModalShow}
          onClose={() => this.setState({declineModalShow: false})}
          onSubmit={value => {
            this.declineWork(value);
            this.setState({declineModalShow: false});
          }}
        />
        }
      </main>
    );
  }
}
