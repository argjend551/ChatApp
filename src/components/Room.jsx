import Message from '../components/Message';
import { Container, Row, Col, Form, Alert, Button } from 'react-bootstrap';
import { useEffect } from 'react';
export default function Room({ room, roomMessages, setRoom, setSSE, SSE }) {
  useEffect(() => {
    const container = document.getElementById('message-container');
    container.scrollTop = container.scrollHeight;
  }, [roomMessages]);

  return (
    <>
      {roomMessages.length > 0 ? (
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
      )}
    </>
  );
}
