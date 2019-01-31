import React from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'semantic-ui-react';

export default class HeaderTopPanel extends React.Component {
  constructor() {
    super();
    this.state = {};
  }

  render() {
    const { user, all, done, overdue } = this.props;

    return (
      <div className="top-panel__inner">
        <div className="top-panel__item">
          <Icon size="large" color="blue" name="user" />
          <span>{user}</span>
        </div>
        <div className="top-panel__centered">
          <div className="top-panel__item">
            <Icon size="large" color="blue" name="ordered list" />
            <span>{all}</span>
          </div>
          <div className="top-panel__item">
            <Icon size="large" color="green" name="checkmark" />
            <span>{done}</span>
          </div>
          <div className="top-panel__item">
            <Icon size="large" color="red" name="dont" />
            <span>{overdue}</span>
          </div>
        </div>
      </div>
    );
  }
}

HeaderTopPanel.propTypes = {
  user: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  all: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  done: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
  overdue: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.number,
  ]),
};
