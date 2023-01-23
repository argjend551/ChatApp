import React, { useState } from 'react';
import { useEffect } from 'react';
import { AiOutlineClose } from 'react-icons/ai';

const RoomMembersDropdown = ({ room, members, setMembers, user }) => {
  const [moderator, setModerator] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    (async () => {
      setMembers([]);
      const response = await fetch(`/api/getRoomMembers/${room.roomId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setMembers(data.members);
      setModerator(data.moderator);
    })();
  }, [room]);

  async function ban(userId, roomId) {
    const response = await fetch('api/banUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ userId, roomId }),
    });
    await response.json();

    setMembers((prevMembers) =>
      prevMembers.map((member) => {
        if (member.id === userId) {
          member.banned = true;
        }
        return member;
      })
    );
  }

  return (
    <div className='RoomMembers-dropdown'>
      {isOpen ? (
        <></>
      ) : (
        <div onClick={() => setIsOpen(!isOpen)}>Room Members</div>
      )}

      <div className={`dropdown-content ${isOpen ? 'open' : ''}`}>
        <span className='dropdown-close'>
          <AiOutlineClose onClick={() => setIsOpen(!isOpen)} />
        </span>
        <>
          <div className='moderatorTag'>Moderator: {moderator}</div>
          {members.length ? (
            members.map((member, index) => (
              <div key={index} className='member-wrapper'>
                <div>{member.username}</div>
                {user.moderator.moderator || user.role === 'admin' ? (
                  <div onClick={() => ban(member.id, room.roomId)}>
                    <p className={`${member.banned ? 'BANNED' : 'ban'}`}>
                      {member.banned ? 'BANNED' : 'Ban'}
                    </p>
                  </div>
                ) : (
                  <></>
                )}
              </div>
            ))
          ) : (
            <p>No members in the room</p>
          )}
        </>
      </div>
    </div>
  );
};

export default RoomMembersDropdown;
