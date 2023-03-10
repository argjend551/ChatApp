import React from 'react';
import { VscSearch } from 'react-icons/vsc';
import { useState, useEffect } from 'react';
import { AiOutlineCheck } from 'react-icons/ai';
import { AiOutlineClose } from 'react-icons/ai';
import { BiLogOut } from 'react-icons/bi';
import { Container, Row, Col } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
const SearchBar = ({
  joinRoom,
  rooms,
  users,
  activeList,
  setActiveList,
  invitations,
  getRooms,
  setCreateRoom,
  setLoginParent,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const [copyInvitations, setCopyInvitations] = useState([]);

  let navigate = useNavigate();
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
  async function logout() {
    try {
      await fetch('api/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoginParent(false);
      navigate('/');
    }
  }

  return (
    <Container className='list-top'>
      <Row>
        <Col xs={12}>
          <div className='search-container'>
            <input
              type='text'
              placeholder='Search...'
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <VscSearch />
          </div>
        </Col>
        <Col xs={12}>
          <div
            className={`myChats${activeList === 'rooms' ? 'clicked' : ''}`}
            onClick={() => setActiveList('rooms')}
          >
            My Rooms
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
            Invitations{' '}
            <p className='invitation-length'>{copyInvitations.length}</p>
          </div>
          <div className='logout-btn' onClick={() => logout()}>
            <BiLogOut /> Logout
          </div>
          <div className='newRoom' onClick={() => setCreateRoom(true)}>
            + New Room
          </div>
        </Col>
        <Col xs={12}>
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
                  <p>joinroom "{x.roomName}"</p>
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
              ))}{' '}
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
        </Col>
      </Row>
    </Container>
  );
};

export default SearchBar;
