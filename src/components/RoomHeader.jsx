import React, { useState } from 'react';
import { Button, Container } from 'react-bootstrap';
import { IoMdSend } from 'react-icons/io';

function RoomHeader({ room }) {
  console.log(room.roomName);

  return <>{room.roomName ? <div>{room.roomName}</div> : <></>}</>;
}

export default RoomHeader;
