import React, { useState } from 'react';
import { Form, Button, FormControl } from 'react-bootstrap';
import { IoMdSend } from 'react-icons/io';

function MessageBar({ roomId }) {
  let [message, setMessage] = useState('');

  function handleChange(event) {
    setMessage(event.target.value);
  }

  async function sendMessage(event) {
    event.preventDefault();
    try {
      const response = await fetch(`/api/send-message-to-room`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: roomId,
          message: message,
        }),
      });
      await response.json();
      setMessage('');
    } catch (error) {
      console.error(error.message);
    }
  }

  return (
    <form onSubmit={sendMessage} className='message-bar'>
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
