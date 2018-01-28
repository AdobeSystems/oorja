import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { Intent, Button } from '@blueprintjs/core';
import SupremeToaster from '../../components/Toaster';

import { checkPassword } from '../../actions/roomConfiguration';
import './passwordForm.scss';

class PasswordPrompt extends Component {
  constructor(props) {
    super(props);

    this.state = {
      password: '',
      tries: 0,
      waiting: false,
      authSuccess: false,
    };

    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({
      ...this.state,
      password: event.target.value,
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.setState({
      ...this.state,
      waiting: true,
    });
    this.props.checkPassword(this.props.roomName, this.state.password)
      .then(() => {
        debugger;
        this.setState({
          ...this.state,
          authSuccess: true,
        });
        this.props.onSuccess();
      })
      .catch((response) => {
        debugger;
        SupremeToaster.show({
          message: response.message,
          intent: Intent.WARNING,
          timeout: 4000,
        });
        this.setState({
          ...this.state,
          password: '',
          waiting: false,
          tries: this.state.tries + 1, // setState is async, this should not be this way.
        });
      });
  }

  render() {
    return (
      <div className="passwordFormContainer">
        <div className="passwordForm">
          <form onSubmit={this.handleSubmit.bind(this)}>
            <input
              placeholder="Room Password..."
              value={this.state.password}
              onChange={this.handleChange.bind(this)}
              type="password"
            />
            <Button
              type="submit"
              loading={this.state.waiting}
              onClick={this.handleSubmit}
              className="pt-large pt-intent-primary"
              text="submit">
            </Button>
          </form>
        </div>
      </div>
    );
  }
}

PasswordPrompt.propTypes = {
  checkPassword: PropTypes.func.isRequired,
  onSuccess: PropTypes.func.isRequired,
  roomName: PropTypes.string,
};

export default connect(null, { checkPassword })(PasswordPrompt);
