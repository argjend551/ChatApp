import Message from '../components/Message';
import MessageBar from '../components/MessageBar';
import { Container, Row, Col, Form, Alert, Button } from 'react-bootstrap';
import { useRef, useEffect } from 'react';
import RoomHeader from './RoomHeader';
export default function Room({
  room,
  roomMessages,
  setRoom,
  setRoomMessages,
  setSSE,
  SSE,
}) {
  useEffect(() => {
    const container = document.getElementById('message-container');
    container.scrollTop = container.scrollHeight;
  }, [roomMessages]);

  const containerRef = useRef(null);

  return (
    <>
      {roomMessages.map((x, i) => (
        <Message
          key={i}
          text={x.message}
          sender={x.sender}
          sentByMe={x.sentByMe}
          date={x.date}
        />
      ))}
    </>
  );
}
