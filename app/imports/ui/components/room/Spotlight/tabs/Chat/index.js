import { Meteor } from 'meteor/meteor';
import _ from 'lodash';
import React, { Component } from 'react';
import classNames from 'classnames';
import update from 'immutability-helper';
import Remarkable from 'remarkable';
// import hljs from 'highlight.js';

import Avatar from '../../../Avatar';
import roomActivities from '../../../constants/roomActivities';

import Y from '../../../../../../modules/Yjs';
import tabPropTypes from '../tabPropTypes';

import Spinner from '../../Spinner';

import './chat.scss';

class Chat extends Component {
  constructor(props) {
    super(props);
    this.y = null;

    this.chatInput = null; // dom element for chatInput
    this.md = new Remarkable({
      linkify: true,
    });

    this.history = 50;

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleChatInput = this.handleChatInput.bind(this);
    this.renderChatBubble = this.renderChatBubble.bind(this);
    this.cleanupChat = this.cleanupChat.bind(this);
    this.appendMessage = this.appendMessage.bind(this);
    this.removeMessage = this.removeMessage.bind(this);
    this.updateState = this.updateState.bind(this);
    this.handleThreadScroll = _.throttle(this.handleThreadScroll, 100);
    this.handleThreadScroll = this.handleThreadScroll.bind(this);
    this.scrollToBottom = this.scrollToBottom.bind(this);
    this.isScrolledToBottom = this.isScrolledToBottom.bind(this);
    this.prefixString = this.props.roomAPI.getUserId() + _.random(5000).toString();

    this.state = {
      initialSyncComplete: false,
      chatInputValue: '',
      chatMessages: [],
      freeNavigation: false,
      newMessageCount: 0,
    };

    this.stateBuffer = this.state;

    function isTouchDevice() { return ('ontouchstart' in document.documentElement); }
    this.touchDevice = isTouchDevice();
  }

  updateState(changes, buffer = this.stateBuffer) {
    this.stateBuffer = update(buffer, changes);
    this.setState(this.stateBuffer);

    if (changes.newMessageCount) {
      const { newMessageCount } = this.stateBuffer;
      this.props.updateBadge({
        visible: newMessageCount > 0,
        content: newMessageCount,
      });
    }
  }

  componentDidMount() {
    const {
      roomAPI, connectedUsers, tabInfo, roomInfo, setTabReady,
    } = this.props;
    new Y({
      db: {
        name: 'indexeddb',
      },
      connector: {
        name: 'oorjaConnector',
        room: `${roomInfo.roomName}:${tabInfo.name}`,
        role: 'slave',
        syncMethod: 'syncAll',
        roomAPI,
        connectedUsers,
        tabInfo,
        roomInfo,
      },
      share: {
        chat: 'Array',
      },
    }).then((y) => {
      this.y = y;

      y.share.chat.observe((event) => {
        if (event.type === 'insert') {
          for (let i = 0; i < event.length; i++) {
            this.appendMessage(event.values[i], event.index);
          }
        } else if (event.type === 'delete') {
          for (let i = 0; i < event.length; i++) {
            this.removeMessage(event.index);
          }
        }
        // concurrent insertions may result in a history > this.history, so cleanup here
        this.cleanupChat();
      });

      y.connector.whenSynced(() => {
        this.updateState({ initialSyncComplete: { $set: true } });
        console.info(tabInfo.name, 'synced');
      });

      y.share.chat.toArray().forEach(this.appendMessage);
      this.cleanupChat();

      roomAPI.addActivityListener(roomActivities.TAB_SWITCH, (payload) => {
        if (payload.to === tabInfo.tabId) {
          if (this.chatInput && !this.props.touchDevice) { // input element is mounted
            this.chatInput.focus();
          }
          if (this.stateBuffer.newMessageCount > 0 && this.isScrolledToBottom()) {
            this.updateState({
              newMessageCount: { $set: 0 },
            });
          }
        }
      });
      setTabReady();
    });
  }

  cleanupChat(y = this.y) {
    while (y.share.chat.length > this.history) {
      y.share.chat.delete(0);
    }
  }

  appendMessage(message, position) {
    console.info(this.props.tabInfo.name, 'appending message', position, message);
    const user = this.props.roomAPI.getUserInfo(message.userId);
    if (!user) throw new Meteor.Error('chat sender not found');

    const chatMessage = {
      user,
      key: message.key,
      text: message.text,
    };

    let { newMessageCount } = this.stateBuffer;
    if (this.stateBuffer.freeNavigation || !this.props.onTop) {
      newMessageCount += 1;
    }
    this.updateState({
      chatMessages: { $splice: [[position, 0, chatMessage]] },
      newMessageCount: { $set: newMessageCount },
    });


    if (
      this.props.onTop &&
      (message.userId === this.props.roomAPI.getUserId() || !this.stateBuffer.freeNavigation)
    ) {
      setTimeout(this.scrollToBottom, 200); // component should have updated by now
    }
  }

  removeMessage(position) {
    console.info(this.props.tabInfo.name, 'removing message', position);
    this.updateState({
      chatMessages: { $splice: [[position, 1]] },
    });
  }

  handleChatInput(event) {
    this.updateState({
      chatInputValue: { $set: event.target.value },
    });
  }

  isScrolledToBottom() {
    if (!this.chatThread) return true;
    const { scrollHeight, clientHeight, scrollTop } = this.chatThread;
    return scrollHeight - clientHeight <= scrollTop + 60;
  }


  handleThreadScroll() {
    if (this.isScrolledToBottom()) {
      this.updateState({
        freeNavigation: { $set: false },
        newMessageCount: { $set: 0 },
      });
      return;
    }

    if (this.stateBuffer.freeNavigation) return;

    this.updateState({
      freeNavigation: { $set: true },
      newMessageCount: { $set: 0 },
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    const { chatInputValue } = this.state;
    if (!chatInputValue || !this.y) return;
    const message = {
      userId: this.props.roomAPI.getUserId(),
      key: _.uniqueId(this.prefixString),
      text: chatInputValue.trim(),
    };

    this.updateState({
      chatInputValue: { $set: '' },
    });
    this.y.share.chat.push([message]);
  }

  renderChatBubble(chatMessage, index) {
    let inContinuation = false;
    let messageAbove = null;
    if (index > 0) {
      messageAbove = this.state.chatMessages[index - 1];
      if (chatMessage.user.userId === messageAbove.user.userId) {
        inContinuation = true;
      }
    }

    const sender = chatMessage.user.userId === this.props.roomAPI.getUserId();
    const bubbleClassNames = {
      bubble: true,
      sent: sender,
      recepient: !sender,
      begining: !inContinuation,
    };
    const { user, key } = chatMessage;
    return (
      <li
        className={classNames(bubbleClassNames)}
        key={key}>
        <Avatar user={user}/>
        <div
          dangerouslySetInnerHTML={{ __html: this.md.render(chatMessage.text) }}>
        </div>
      </li>
    );
  }

  componentWillUnmount() {
    this.y.close();
  }

  scrollToBottom() {
    const { scrollHeight, clientHeight } = this.chatThread;
    this.updateState({
      freeNavigation: { $set: false },
      newMessageCount: { $set: 0 },
    });
    this.chatThread.scrollTop = scrollHeight - clientHeight;
  }

  render() {
    const unreadMessageTickerStyle = {
      visibility: this.state.newMessageCount > 0 && !this.isScrolledToBottom() ? 'initial' : 'hidden',
    };
    const isSyncing = (!this.state.initialSyncComplete) && (this.props.connectedUsers.length > 1);
    return (
      <div className={this.props.classNames} style={this.props.style}>
        <ul className="chat-thread"
          onScroll={this.handleThreadScroll}
          ref={ (chatThread) => { this.chatThread = chatThread; }}>
          {this.state.chatMessages.map(this.renderChatBubble)}

          <div
            className="unreadMessageTicker"
            style={unreadMessageTickerStyle}
            onClick={this.scrollToBottom}>
            <i className="icon ion-ios-arrow-down"></i> {this.state.newMessageCount}
          </div>
        </ul>
        <form className="chat-input-form" onSubmit={this.handleSubmit}>
          <Spinner show={this.props.onTop && isSyncing}/>
          <input className="chat-input"
                 name="chat-input"
                 placeholder= "Write a message..."
                 type="text"
                 autoComplete="off"
                 value={this.state.chatInputValue}
                 onChange={this.handleChatInput}
                 ref = { (input) => { this.chatInput = input; } }
          />
          <div className="sendButton" onClick={this.handleSubmit}>
            <i className="icon ion-ios-paperplane"></i>
          </div>
        </form>
      </div>
    );
  }
}

Chat.propTypes = tabPropTypes;

export default Chat;
