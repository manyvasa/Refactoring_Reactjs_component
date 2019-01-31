import React from 'react';
import { Form, Radio, Table } from 'semantic-ui-react';
import PropTypes from 'prop-types';
import Datetime from 'react-datetime';

export default class ItemTree extends React.Component {
  constructor() {
    super();
    this.state = {};

    this.getDate = this.getDate.bind(this);
  }

  getDate(date) {
    if (typeof date === 'string') return new Date(date);

    return date;
  }

  render() {
    const {
      name,
      check,
      checklistId,
      metricId,
    } = this.props;

    return (
      <div
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
                  onChange={() => this.props.radioHandler(checklistId, metricId, true)}
                />
              </Table.Cell>
              <Table.Cell verticalAlign="top" collapsing>
                <label style={{ marginLeft: 20 }}>нет</label>
                <Radio
                  style={{ marginLeft: 10 }}
                  checked={check && check.value === false}
                  onChange={() => this.props.radioHandler(checklistId, metricId, false)}
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
                        value={this.getDate(check.date_from)}
                        locale="ru"
                        dateFormat={false}
                        timeFormat={'HH:mm:ss'}
                        onChange={date => this.props.dateTimeHandler(checklistId, metricId, date)}
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
}

ItemTree.propTypes = {
  name: PropTypes.string.isRequired,
  checklistId: PropTypes.number.isRequired,
  metricId: PropTypes.number.isRequired,
  dateTimeHandler: PropTypes.func.isRequired,
  radioHandler: PropTypes.func.isRequired,
  check: PropTypes.object.isRequired,
};
