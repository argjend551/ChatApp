import React, { useState, useEffect } from 'react';
import { AiOutlineClose } from 'react-icons/ai';
import { FaUsers } from 'react-icons/fa';
import UsersDropDown from './UsersDropDown';
import { Container, Row, Col, Button } from 'react-bootstrap';
const RoomMembersDropdown = ({
  room,
  members,
  setMembers,
  user,
  users,
  setUsers,
}) => {
  const [moderator, setModerator] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [moderatorIsReady, setModeratorIsReady] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        setIsOpen(false);
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
      } catch (err) {
      } finally {
        setModeratorIsReady(true);
      }
    })();
  }, [room]);

  async function inviteToRoom(roomId) {
    try {
      await fetch(`/api/inviteToRoom`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: roomId,
          invitedMembers: selectedUsers,
        }),
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsOpen(false);
      setSelectedUsers([]);
    }
  }

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
    <Container className='RoomMembers-dropdown'>
      <Row>
        <Col xs={12}>
          {isOpen ? (
            <></>
          ) : (
            <div className='roomMember-icon-wrapper'>
              <FaUsers
                className='roomMembers-icon'
                onClick={() => setIsOpen(!isOpen)}
              />
            </div>
          )}
        </Col>
        <Col xs={12}>
          <div className={`dropdown-content ${isOpen ? 'open' : ''}`}>
            <span className='dropdown-close'>
              <AiOutlineClose onClick={() => setIsOpen(!isOpen)} />
            </span>
            <>
              <div className='moderatorTag'>Moderator: {moderator}</div>
              {members.length && moderatorIsReady ? (
                members.map((member, index) => (
                  <div key={index} className='member-wrapper'>
                    <div>
                      {member.username}{' '}
                      {member.admin ? <p className='adminTag'>Admin</p> : <></>}
                    </div>
                    {user.moderator.moderator || user.role === 'admin' ? (
                      <div onClick={() => ban(member.id, room.roomId)}>
                        {!member.admin ? (
                          <p className={`${member.banned ? 'BANNED' : 'ban'}`}>
                            {member.banned ? 'BANNED' : 'Ban'}
                          </p>
                        ) : (
                          <></>
                        )}
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
            {(moderatorIsReady && user.moderator.moderator) ||
            user.role === 'admin' ? (
              <>
                <p className='inviteAmembertext'>Invite an member</p>
                <div className='inviteAMember'>
                  <UsersDropDown
                    users={users}
                    setUsers={setUsers}
                    selectedUsers={selectedUsers}
                    setSelectedUsers={setSelectedUsers}
                  />
                </div>
                <div className='inviteToRoomBTN'>
                  <Button
                    variant='primary'
                    disabled={!selectedUsers.length}
                    onClick={() => inviteToRoom(room.roomId)}
                  >
                    Invite to room
                  </Button>
                </div>
              </>
            ) : (
              <></>
            )}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default RoomMembersDropdown;
