import React from 'react';
import PropTypes from 'prop-types';
import PlayerIvideon from 'components/PlayerIvideon';
import { Button, Select } from 'semantic-ui-react';

export default class CameraPlayer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentCamera: Number(localStorage.getItem('cameraId')) || 0,
      restartKey: 0,
      playSpeed: 1,
      playQuality: 2,
    };

    this.player = React.createRef();
    this.onChangeCamera = this.onChangeCamera.bind(this);
    this.handleChangeQuality = this.handleChangeQuality.bind(this);
    this.handleChangeSpeed = this.handleChangeSpeed.bind(this);
    this.restartIvideonPlayer = this.restartIvideonPlayer.bind(this);
    this.getCameraOptions = this.getCameraOptions.bind(this);
  }

  onChangeCamera(value) {
    localStorage.setItem('cameraId', value);
    this.setState({ currentCamera: value });

    if (!this.state.showLocalPlayer) {
      this.restartIvideonPlayer();
    }
  }

  handleChangeSpeed(e, select) {
    this.setState({ playSpeed: select.value });
  }

  handleChangeQuality(e, select) {
    this.setState({ playQuality: select.value });
  }

  getCameraOptions() {
    const { taskData } = this.props;
    return taskData
      ? taskData.task_info.cameras.map((item, i) => ({
        text: item.name,
        value: i,
      }))
      : [];
  }

  restartIvideonPlayer() {
    this.setState({ restartKey: Math.random() });
  }

  render() {
    const {
      currentCamera,
      restartKey,
      playQuality,
      playSpeed,
    } = this.state;

    return (
      <div className="left-side__inner">
        <div className="left-side__player">
          <PlayerIvideon
            ref={this.player}
            currentCamera={currentCamera}
            key={restartKey}
            speed={playSpeed}
            quality={playQuality}
          />
        </div>

        <div className="left-side__toolbar player-toolbar">

          <Button
            className="restart-button"
            color="blue"
            onClick={this.restartIvideonPlayer}
          >
            Перезагрузить плеер
          </Button>

          <div className="player-toolbar__control">
            <label>
              Камера:
            </label>
            <Select
              options={this.getCameraOptions()}
              value={currentCamera}
              onChange={(e, select) => this.onChangeCamera(select.value)}
            />
          </div>

          <div className="player-toolbar__control">
            <label>
              Качество:
            </label>
            <Select
              id="quality"
              options={[
                { text: 'Низкое', value: 0, key: 0 },
                { text: 'Среднее', value: 1, key: 1 },
                { text: 'Высокое', value: 2, key: 2 },
              ]}
              value={playQuality}
              onChange={this.handleChangeQuality}
              className="player-toolbar__quality-select"
            />
          </div>

          <div className="player-toolbar__control">
            <label>
              Скорость:
            </label>
            <Select
              options={[
                { text: 'x1', value: 1, key: 0 },
                { text: 'x2', value: 2, key: 1 },
                { text: 'x4', value: 4, key: 2 },
                { text: 'x8', value: 8, key: 3 },
                { text: 'x16', value: 16, key: 4 },
                { text: 'x32', value: 32, key: 5 },
                { text: 'x64', value: 64, key: 6 }]}
              value={playSpeed}
              onChange={this.handleChangeSpeed}
              className="player-toolbar__speed-select"
            />
          </div>

          <div className="player-toolbar__divider" />

          <div className="player-toolbar__buttons">
            <Button content="10с" icon="undo" labelPosition="left" onClick={() => this.player.current.getWrappedInstance().changePlaySettings(-10)} />
            <Button content="30с" icon="redo" labelPosition="right" onClick={() => this.player.current.getWrappedInstance().changePlaySettings(30)} />
            <Button content="3м" icon="redo" labelPosition="right" onClick={() => this.player.current.getWrappedInstance().changePlaySettings(180)} />
          </div>

        </div>
      </div>
    );
  }
}

CameraPlayer.propTypes = {
  taskData: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]).isRequired,
};
