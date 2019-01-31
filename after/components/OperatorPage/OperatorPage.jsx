import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Dimmer, Loader } from 'semantic-ui-react';
import { formsDataSave } from 'data/OperatorPage/actions';
import OperatorSideBar from 'containers/OperatorPage/OperatorSideBar';
import OperatorHeader from 'containers/OperatorPage/OperatorHeader';
import OperatorCheckLists from 'containers/OperatorPage/OperatorCheckLists';
import CameraPlayer from 'components/OperatorPage/CameraPlayer';

class OperatorPage extends React.Component {
  componentDidMount() {
    localStorage.setItem('isSmartmetricsTeam', 'true');
  }

  render() {
    const {
      onSaveForms,
      loader,
      taskData,
    } = this.props;

    return (
      <main className="operator">
        <OperatorHeader
          onSaveForms={onSaveForms}
        />
        <div className="operator__container">
          <Dimmer
            active={loader}
            inverted
          >
            <Loader inverted />
          </Dimmer>

          { taskData

          && (
            <div className="operator__content">
              <div className="operator__left left-side">
                <CameraPlayer
                  taskData={taskData}
                />
              </div>
              <div className="operator__right right-side">
                <OperatorCheckLists
                  onSaveForms={onSaveForms}
                />
              </div>
            </div>
          )
          }
        </div>
        <OperatorSideBar />

      </main>
    );
  }
}

OperatorPage.propTypes = {
  loader: PropTypes.bool.isRequired,
  taskData: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.object,
  ]).isRequired,
  onSaveForms: PropTypes.func.isRequired,
};

const mapStateToProps = state => ({
  loader: state.operatorPage.loader,
  taskData: state.operatorPage.taskData,
});

const mapDispatchToProps = dispatch => ({

  onSaveForms: forms => {
    dispatch(formsDataSave(forms));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(OperatorPage);
