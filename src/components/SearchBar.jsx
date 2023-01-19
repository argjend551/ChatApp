import React from 'react';
import { VscSearch } from 'react-icons/vsc';
import { useState } from 'react';
import { AiOutlineCheck } from 'react-icons/ai';
import { AiOutlineClose } from 'react-icons/ai';
import { useEffect } from 'react';
export default function SearchBar({
  joinRoom,
  rooms,
  users,
  activeList,
  setActiveList,
  invitations,
  getRooms,
  setCreateRoom,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copyInvitations, setCopyInvitations] = useState('');

  useEffect(() => {
    setCopyInvitations([...invitations]);
  }, [invitations]);

  async function handleInvitation(invitationId, Accepted) {
    await fetch('/api/handleInvitation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ invitationId, Accepted }),
    });

    setCopyInvitations(
      copyInvitations.filter(
        (invitation) => invitation.invitationId !== invitationId
      )
    );
    getRooms();
  }

  return (
    <div className='list-top'>
      <div className='search-container'>
        <input
          type='text'
          placeholder='Search...'
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ position: 'relative' }}
        />
        <VscSearch />
      </div>

      <div
        className={`myChats${activeList === 'rooms' ? 'clicked' : ''}`}
        onClick={() => setActiveList('rooms')}
      >
        My Chats
      </div>
      <div
        className={`myUsers${activeList === 'users' ? 'clicked' : ''}`}
        onClick={() => setActiveList('users')}
      >
        Users
      </div>
      <div
        className={`myInvitations${
          activeList === 'invitations' ? 'clicked' : ''
        }`}
        onClick={() => setActiveList('invitations')}
      >
        Invitations <p className='invitation-length'>{invitations.length}</p>
      </div>
      <div className='newRoom' onClick={() => setCreateRoom(true)}>
        + New Room
      </div>
      {activeList === 'rooms' &&
        rooms
          .filter((x) =>
            x.roomName.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((x, i) => (
            <div className='room' key={i} onClick={() => joinRoom(x)}>
              {x.roomName}
            </div>
          ))}
      {activeList === 'invitations' &&
        copyInvitations
          .filter((x) =>
            x.roomName.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((x, i) => (
            <div className='invitations-wrap' key={i}>
              <p>join room "{x.roomName}"</p>
              <div className='iconWrap'>
                <span
                  className='acceptInvitation'
                  onClick={() => handleInvitation(x.invitationId, true)}
                >
                  <AiOutlineCheck />
                </span>
                <span
                  className='declineInvitation'
                  onClick={() => handleInvitation(x.invitationId, false)}
                >
                  <AiOutlineClose />
                </span>
              </div>
            </div>
          ))}

      {activeList === 'users' &&
        users
          .filter((x) =>
            x.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((x, i) => (
            <div className='room' key={i}>
              {x.name}
            </div>
          ))}
    </div>
  );
}
