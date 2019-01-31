import React from 'react';
import { connect } from 'react-redux';
import { Button } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import {
  workEndRequest,
  metricsSave,
  selectedChecklistIdSet,
  timeToEndSet,
} from 'data/OperatorPage/actions';
import CheckListItem from 'components/OperatorPage/CheckListItem';
import ItemTree from 'components/OperatorPage/ItemTree';

class OperatorCheckLists extends React.Component {
  constructor() {
    super();

    this.forms = [];
    this.prepareMetrics = this.prepareMetrics.bind(this);
    this.prepareArray = this.prepareArray.bind(this);
    this.formCancel = this.formCancel.bind(this);
    this.formSubmit = this.formSubmit.bind(this);
    this.buildTree = this.buildTree.bind(this);
    this.radioHandler = this.radioHandler.bind(this);
    this.dateTimeHandler = this.dateTimeHandler.bind(this);
    this.saveForms = this.saveForms.bind(this);
    this.afterSuccessSaveMetrics = this.afterSuccessSaveMetrics.bind(this);
    this.resetForm = this.resetForm.bind(this);
    this.workEnd = this.workEnd.bind(this);
    this.onWorkEnded = this.onWorkEnded.bind(this);
  }

  onWorkEnded() {
    const { onSetTimeToEnd } = this.props;
    onSetTimeToEnd(false);
  }

  prepareMetrics(id) {
    const { taskData } = this.props;
    const currentMetric = taskData.task_checklists.find(item => item.metric_id === id);
    const metrics = this.prepareArray(currentMetric.metrics, id);

    return (this.buildTree(metrics));
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

  formCancel() {
    const { onSelectedChecklistId } = this.props;
    this.forms = [];

    onSelectedChecklistId(false);
  }

  formSubmit() {
    const {
      forms,
      selectedChecklistId,
      saveMetrics,
    } = this.props;

    const checklist = forms[selectedChecklistId];

    const metrics = Object.keys(checklist).map(key => {
      const { form } = checklist[key];
      const cameraId = form.camera_id || '';
      const { comment } = form; // TODO: Seems like the comment is not needed - remove
      const metricId = key;

      let value = 1;
      let dateFrom = form.date_from;
      if (form.value === false) {
        value = 2;
      }

      if (value === 2) {
        dateFrom = new Date(dateFrom).toISOString();
      }

      return {
        metric_id: metricId,
        value,
        comment,
        date_from: dateFrom,
        camera_id: cameraId,
      };
    });
    saveMetrics(metrics, undefined, this.afterSuccessSaveMetrics);
  }

  saveForms(forms) {
    const { onSaveForms } = this.props;

    onSaveForms(forms);
    localStorage.setItem('forms', JSON.stringify(forms));
  }

  resetForm() {
    const {
      forms,
      selectedChecklistId,
      onSaveForms,
    } = this.props;

    const checklist = forms[selectedChecklistId];

    Object.keys(checklist).forEach(e => {
      checklist[e].form.value = true;
    });

    forms[selectedChecklistId] = checklist;

    onSaveForms(forms);
    localStorage.setItem('forms', '');
  }

  radioHandler(checklistId, metricId, value) {
    const millisecondsInSecond = 1000;
    const { forms } = this.props;

    let date = null;
    let currentCameraId = null;

    if (!value) {
      const {
        currentCamera,
        currentPlayTime,
        taskData,
      } = this.props;

      date = new Date(currentPlayTime * millisecondsInSecond);
      currentCameraId = taskData.task_info.cameras[currentCamera].camera_id;
    }

    forms[checklistId][metricId].form = {
      value,
      comment: '',
      date_from: date,
      camera_id: currentCameraId,
    };

    this.saveForms(forms);
  }

  dateTimeHandler(checklistId, metricId, date) {
    const { forms } = this.props;

    forms[checklistId][metricId].form.date_from = date._d;

    this.saveForms(forms);
  }

  afterSuccessSaveMetrics(payload, metrics, type) {
    // TODO: This checking logic will be removed when backend will be repaired
    const metricsHasSent = payload
                           && payload.response
                           && payload.response.task_info
                           && typeof payload.response.task_info === 'object';

    if (metricsHasSent) {
      this.resetForm();
      this.formCancel();
    } else {
      const { saveMetrics } = this.props;

      alert('Произошла ошибка! Нажмите "ОК" для повторной отправки.');
      saveMetrics(metrics, type, this.afterSuccessSaveMetrics);
    }
  }

  workEnd() {
    const { onWorkEnd } = this.props;

    onWorkEnd(this.onWorkEnded);
  }

  buildTree(arr) {
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

      const checklistId = this.props.selectedChecklistId;
      const check = this.props.forms[checklistId][metricId].form;

      if (isEnd) {
        return (
          <ItemTree
            key={name}
            name={name}
            check={check}
            checklistId={checklistId}
            metricId={metricId}
            radioHandler={this.radioHandler}
            dateTimeHandler={this.dateTimeHandler}
          />
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

  render() {
    const {
      selectedChecklistId,
      onSelectedChecklistId,
      counterMetric,
      saveMetric,
      saveMetrics,
      taskData,
    } = this.props;

    const checkLists = taskData ? taskData.task_checklists : [];
    let isWorkEnd = true;
    checkLists.forEach(item => {
      if (item.to_do !== item.done && item.type !== 3 && item.type !== 4 && item.type !== 5) {
        isWorkEnd = false;
      }
    });
    if (checkLists.length === 0) {
      isWorkEnd = false;
    }

    return (
      <div className="checklists">
        {selectedChecklistId !== false
        && this.prepareMetrics(selectedChecklistId)
        }
        {selectedChecklistId !== false
        && (
          <div
            style={{ position: 'fixed', bottom: 40, right: 40 }}
          >
            <Button
              onClick={() => this.formCancel()}
            >
Назад
            </Button>
            <Button
              style={{ marginLeft: 16 }}
              color="blue"
              onClick={() => this.formSubmit()}
            >
Отправить
            </Button>
          </div>
        )
        }
        <div>
          {selectedChecklistId === false && checkLists.map((metric, i) => {
            let count = metric.count || 0;
            let isChanged = false;
            const {
              name,
              type,
              done,
              metric_id: metricId,
              to_do: toDo,
            } = metric;

            if (counterMetric[metricId] !== undefined) {
              count = counterMetric[metricId];
              if (count !== metric.count) {
                isChanged = true;
              }
            }
            if (type === 5) {
              count = counterMetric[metricId] || '';
            }

            if (type !== 3 && type !== 4 && type !== 5) {
              return (
                <CheckListItem
                  key={metricId}
                  index={i}
                  type={type}
                  name={name}
                  done={done}
                  toDo={toDo}
                  onSelected={onSelectedChecklistId}
                  metricId={metricId}
                />
              );
            }

            return (
              <CheckListItem
                key={metricId}
                index={i}
                type={type}
                name={name}
                count={count}
                isChanged={isChanged}
                onSelected={onSelectedChecklistId}
                onSave={saveMetric}
                onSaveMetrics={saveMetrics}
                afterSuccessSaveMetrics={this.afterSuccessSaveMetrics}
                metricId={metricId}
              />
            );
          })}

          {isWorkEnd && selectedChecklistId === false
          && (
            <Button
              style={{ position: 'absolute', bottom: 16, right: 16 }}
              color="blue"
              onClick={this.workEnd}
            >
Закончить задачу
            </Button>
          )
          }
        </div>
      </div>
    );
  }
}

OperatorCheckLists.propTypes = {
  onSaveForms: PropTypes.func.isRequired,
  saveMetric: PropTypes.func.isRequired,
  saveMetrics: PropTypes.func.isRequired,
  onSelectedChecklistId: PropTypes.func.isRequired,
  onWorkEnd: PropTypes.func.isRequired,
  onSetTimeToEnd: PropTypes.func.isRequired,
  forms: PropTypes.object.isRequired,
  counterMetric: PropTypes.object.isRequired,
  currentPlayTime: PropTypes.number.isRequired,
  taskData: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]).isRequired,
  selectedChecklistId: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.number,
  ]).isRequired,
  currentCamera: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.number,
  ]).isRequired,
};

const mapStateToProps = state => ({
  forms: state.operatorPage.forms,
  counterMetric: state.operatorPage.counterMetric,
  currentPlayTime: state.operatorPage.currentPlayTime,
  taskData: state.operatorPage.taskData,
  selectedChecklistId: state.operatorPage.selectedChecklistId,
  currentCamera: state.operatorPage.currentCamera,
});

const mapDispatchToProps = dispatch => ({

  onSelectedChecklistId: bool => {
    dispatch(selectedChecklistIdSet(bool));
  },

  saveMetrics: (metrics, type, afterSuccessSaveMetrics) => {
    dispatch(metricsSave(metrics, type, payload => {
      afterSuccessSaveMetrics(payload, metrics, type);
    }));
  },

  saveMetric: (metricId, value) => {
    dispatch({ type: 'SAVE_COUNTER_METRIC', metricId, value });
  },

  onWorkEnd: afterSuccessWorkEnd => {
    dispatch(workEndRequest(afterSuccessWorkEnd));
  },

  onSetTimeToEnd: timeToEnd => {
    dispatch(timeToEndSet(timeToEnd));
  },

});

export default connect(mapStateToProps, mapDispatchToProps)(OperatorCheckLists);
