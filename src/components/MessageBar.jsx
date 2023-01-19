import React, { useState } from 'react';
import { Form, Button, FormControl } from 'react-bootstrap';
import { IoMdSend } from 'react-icons/io';

function MessageBar({ roomId, banned }) {
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
    <form
      onSubmit={sendMessage}
      className={`${banned ? 'message-bar-banned' : 'message-bar'}`}
    >
      <input
        type='text'
        value={message}
        onChange={handleChange}
        placeholder='Type your message'
      />
      <button variant='primary' type='submit' className='sendBtn'>
        <IoMdSend className='sendIcon' />
      </button>
    </form>
  );
}

export default MessageBar;
