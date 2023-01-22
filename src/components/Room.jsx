import Message from '../components/Message';
import { Container, Row, Col, Form, Alert, Button } from 'react-bootstrap';
import { useEffect, useState } from 'react';
import { FaInbox } from 'react-icons/fa';

export default function Room({ roomMessages, banned, room, user }) {
  useEffect(() => {
    const container = document.getElementById('message-container');
    container.scrollTop = container.scrollHeight;
  }, [roomMessages]);
  return (
    <>
      {room ? (
        <>
          {' '}
          {!banned ? (
            roomMessages.length > 0 ? (
              roomMessages.map((x, i) => (
                <Message
                  key={i}
                  messageId={x.id}
                  text={x.message}
                  sender={x.sender}
                  sentByMe={x.sentByMe}
                  date={x.date}
                  admin={x.admin}
                  roomId={room.roomId}
                  deletedByAdmin={x.deleted_by_admin}
                  user={user}
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
      ) : (
        <>
          <span>
            <FaInbox className='no-room-icon' />
          </span>
          <h3>Choose a conversation from the left</h3>
        </>
      )}
    </>
  );
}
