import React from 'react';
import { Button, Icon, Input } from 'semantic-ui-react';
import PropTypes from 'prop-types';

export default class CheckListItem extends React.Component {
  constructor() {
    super();
    this.state = {};

    this.defaultBoxStyle = {
      boxShadow: '0px 0px 3px 0px rgba(0, 0, 0, .4)',
      borderRadius: 5,
      width: '100%',
      padding: 16,
    };
  }

  render() {
    const {
      name,
      type,
      metricId,
      index,
      count,
      isChanged,

    } = this.props;


    if (type !== 3 && type !== 4 && type !== 5) {

      const { done, toDo } = this.props;

      return (
        <div
          style={Object.assign({}, this.defaultBoxStyle, {
            height: 50,
            marginTop: index === 0 ? 0 : 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          })}
        >
          <span style={{ fontSize: 16 }}>{name}</span>
          <div
            style={{
              width: 200,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span>{`${done} из ${toDo}`}</span>
            {done !== toDo &&
            <Button
              style={{ marginLeft: 32 }}
              color="blue"
              onClick={() => {
                this.props.onSelected(metricId);
              }}
            >Начать</Button>
            }
            {done === toDo &&
            <Icon
              style={{ marginLeft: 32 }}
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
        key={metricId}
        style={Object.assign({}, this.defaultBoxStyle, {
          height: 50,
          marginTop: index === 0 ? 0 : 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        })}
      >
        <span style={{ fontSize: 16, marginRight: 10 }}>{name}</span>
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
              onChange={(e, dataInput) => {
                if (dataInput.value >= 0) this.props.onSave(metricId, dataInput.value);
              }}
            />
            {type !== 5 &&
            <div className="nowrap">
              <Icon
                style={{ cursor: 'pointer', marginLeft: 8 }}
                size="large"
                color="red"
                name="minus"
                onClick={() => {
                  if (count > 0) this.props.onSave(metricId, count - 1);
                }}
              />
              <Icon
                style={{ cursor: 'pointer' }}
                size="large"
                color="green"
                name="plus"
                onClick={() => {
                  this.props.onSave(metricId, count + 1);
                }}
              />
            </div>
            }
          </div>
          <div
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: 120 }}
          >
            {isChanged && type !== 5 &&
            <Button
              style={{}}
              color="blue"
              onClick={() => {
                const metrics = [{
                  metric_id: metricId,
                  count,
                }];
                this.props.onSaveMetrics(metrics, type, this.props.afterSuccessSaveMetrics);
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
              style={{ marginLeft: 24 }}
              color="blue"
              onClick={() => {
                const metrics = [{
                  metric_id: metricId,
                  count,
                }];
                this.props.onSaveMetrics(metrics, type, this.props.afterSuccessSaveMetrics);
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
  }
}

CheckListItem.propTypes = {
  name: PropTypes.string.isRequired,
  type: PropTypes.number.isRequired,
  index: PropTypes.number.isRequired,
  metricId: PropTypes.number.isRequired,
  done: PropTypes.number,
  toDo: PropTypes.number,
  count: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  isChanged: PropTypes.bool,
  onSelected: PropTypes.func,
  onSave: PropTypes.func,
  onSaveMetrics: PropTypes.func,
  afterSuccessSaveMetrics: PropTypes.func,
};
