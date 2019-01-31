import React from 'react';
import PropTypes from 'prop-types';
import { Dimmer, Icon, Loader } from 'semantic-ui-react';

export default class HeaderPointInfo extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { clientPoint, clientName, reportDate, timeToEnd, loader } = this.props;

    if (!clientPoint && !clientName && !reportDate && !timeToEnd) return null;

    return (
      <div className="point-info">
        <Dimmer
          active={loader}
          inverted
        >
          <Loader inverted />
        </Dimmer>
        <div className="point-info__inner">
          <div className="point-info__item">
            <Icon size="large" name="user" />
            <span>{clientName}</span>
          </div>
          <div className="point-info__item">
            <Icon size="large" name="map pin" />
            <span>{clientPoint}</span>
          </div>
          <div className="point-info__item">
            <Icon size="large" name="clock" />
            <span>{reportDate}</span>
          </div>
          <div className="point-info__item">
            <Icon size="large" name="clock" />
            <span>{timeToEnd}</span>
          </div>
        </div>
      </div>
    );
  }
}

HeaderPointInfo.propTypes = {
  clientName: PropTypes.string,
  clientPoint: PropTypes.string,
  reportDate: PropTypes.string,
  loader: PropTypes.bool.isRequired,
  timeToEnd: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.bool,
  ]).isRequired,
};
