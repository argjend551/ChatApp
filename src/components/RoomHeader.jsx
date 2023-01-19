import React, { useState } from 'react';
import RoomMembersDropdown from './RoomMembersDropdown';

function RoomHeader({ room, user }) {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const inviteToRoom = async () => {
    try {
      const response = await fetch(`/api/inviteToRoom`, {
        method: 'POST',
        credentials: 'include', // include cookies in the request
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: room.roomId,
          invitedMembers: selectedUsers,
        }),
      });
      await response.json();
    } catch (error) {
      console.error(error);
    }
  };
  return (
    <>
      {room.roomName ? <div>{room.roomName}</div>  : <></>}
      {user.moderator ? (
        <div className='dropdown-inHeader'>
          {selectedUsers.length > 0 && (
            <button onClick={() => inviteToRoom()}>
              Invite selected users
            </button>
          )}
        </div>
      ) : (
        <></>
      )}
    </>
  );
}

export default RoomHeader;
