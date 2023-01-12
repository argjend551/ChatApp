import React from 'react';
import { VscSearch } from 'react-icons/vsc';
import { useState } from 'react';
export default function SearchBar({
  joinRoom,
  rooms,
  users,
  activeList,
  setActiveList,
}) {
  const [searchQuery, setSearchQuery] = useState('');

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
