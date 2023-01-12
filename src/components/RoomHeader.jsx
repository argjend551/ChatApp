import React, { useState } from 'react';
import { Button, Container } from 'react-bootstrap';
import { IoMdSend } from 'react-icons/io';

function RoomHeader({ roomName, setRoomMessages, setRoom, setSSE, SSE }) {
  // async function leaveroom() {
  //   SSE.close();

  //   SSE.addEventListener('disconnect', (message) => {
  //     let data = JSON.parse(message.data);
  //     console.log('[disconnect]', data);
  //     setSSE(null);
  //   });
  //   setRoomMessages(false);
  //   setRoom(false);
  // }

  return <>{roomName}RoomName</>;
}

export default RoomHeader;
