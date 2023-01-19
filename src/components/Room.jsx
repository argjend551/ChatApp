import Message from '../components/Message';
import { Container, Row, Col, Form, Alert, Button } from 'react-bootstrap';
import { useEffect, useState } from 'react';
export default function Room({ roomMessages, banned, room }) {
  useEffect(() => {
    const container = document.getElementById('message-container');
    container.scrollTop = container.scrollHeight;
  }, [roomMessages]);
  return (
    <>
      {!banned ? (
        roomMessages.length > 0 ? (
          roomMessages.map((x, i) => (
            <Message
              key={i}
              text={x.message}
              sender={x.sender}
              sentByMe={x.sentByMe}
              date={x.date}
            />
          ))
        ) : (
          <p>send a message!</p>
        )
      ) : (
        <div className='banned'>
          <p> You are banned from this room</p>
        </div>
      )}
    </>
  );
}
