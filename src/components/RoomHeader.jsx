import React, { useState } from 'react';

function RoomHeader({ room }) {
  return <>{room.roomName ? <div>{room.roomName}</div> : <></>}</>;
}

export default RoomHeader;
