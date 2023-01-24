import React, { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { IoMdSend } from 'react-icons/io';

const MessageBar = ({ roomId, banned }) => {
  let [message, setMessage] = useState('');

  function handleChange(event) {
    setMessage(event.target.value);
  }

  async function sendMessage(event) {
    event.preventDefault();
    try {
      await fetch('/api/sendMessage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message, roomId }),
      });
      setMessage('');
    } catch (error) {
      console.error(error.message);
    }
  }

  return (
    <Form
      onSubmit={sendMessage}
      className={`${banned || !roomId ? 'message-bar-banned' : 'message-bar'}`}
    >
      <Form.Control
        type='text'
        value={message}
        onChange={handleChange}
        placeholder='Type your message'
        className='input-message'
      />
      <Button variant='primary' type='submit' className='sendBtn'>
        <IoMdSend className='sendIcon' />
      </Button>
    </Form>
  );
};

export default MessageBar;
