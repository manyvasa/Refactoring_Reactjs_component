import React from 'react';
import { withRouter } from 'react-router';
import { Icon } from 'semantic-ui-react';
import { clearStorage } from 'utils/auntificate';
import { sideBarToggle } from 'data/OperatorPage/actions';
import connect from 'react-redux/es/connect/connect';
import PropTypes from 'prop-types';

class OperatorSideBar extends React.Component {
  render() {
    const {
      sideBarShow,
      toggleSideBar,
      history,
    } = this.props;
    return (
      <div>
        { sideBarShow
        && (
          <div className="sidebar">
            <div className="sidebar__inner">
              <div />
              <div
                className="sidebar__exit"
                onClick={() => {
                  clearStorage(localStorage);
                  history.push('/');
                }}
              >
                <Icon
                  style={{ marginLeft: 16 }}
                  name="power"
                  size="large"
                  color="blue"
                />
                <span style={{ marginLeft: 8, fontSize: 16 }}>Выйти</span>
              </div>
            </div>
            <div
              className="sidebar__overlay"
              onClick={toggleSideBar}
            />
          </div>
        )
        }
      </div>
    );
  }
}

OperatorSideBar.propTypes = {
  sideBarShow: PropTypes.bool.isRequired,
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
  toggleSideBar: PropTypes.func.isRequired,
};

const mapStateToProps = state => state.operatorPage;

const mapDispatchToProps = dispatch => ({

  toggleSideBar: () => dispatch(sideBarToggle()),

});

const OperatorSideBarWithRouter = withRouter(OperatorSideBar);

export default connect(mapStateToProps, mapDispatchToProps)(OperatorSideBarWithRouter);
