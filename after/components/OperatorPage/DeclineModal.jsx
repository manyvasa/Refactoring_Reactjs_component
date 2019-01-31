import React from 'react';
import { Modal, Button, Form, TextArea } from 'semantic-ui-react';

export default class DeclineModal extends React.Component {
  constructor() {
    super();
    this.state = {
      comment: '',
    };
  }

  render() {
    const { show } = this.props;
    return (
      <Modal
        open={show}
      >
        <Modal.Content>
          <div>
            <Form style={{ marginTop: 16 }}>
              <TextArea
                placeholder="Укажите причину"
                value={this.state.comment}
                onChange={(e, data) => {
                  this.setState({ comment: data.value });
                }}
              />
            </Form>
          </div>
        </Modal.Content>
        <Modal.Actions>
          <Button
            onClick={() => this.props.onClose()}
          >
            Отмена
          </Button>
          <Button
            onClick={() => this.props.onSubmit(this.state.comment)}
          >
            Подтвердить отказ
          </Button>
        </Modal.Actions>
      </Modal>
    );
  }
}
