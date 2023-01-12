import React from 'react';

const Message = ({ text, sentByMe, sender, date }) => {
  return (
    <div className={`${sentByMe ? 'left-msg' : 'right-msg'}`}>
      <div className={`${sentByMe ? 'message-sender' : 'message-reciever'}`}>
        <p className={`${sentByMe ? 'sender' : 'reciever'}`}>{sender}: </p>
        <p className='message-text'>{text}</p>
        <p className={`${sentByMe ? 'sender-time' : 'reciever-time'}`}>
          {date}
        </p>
      </div>
    </div>
  );
};
export default Message;
