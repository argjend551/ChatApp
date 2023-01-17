import React, { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Alert, Button } from 'react-bootstrap';

import SearchBar from '../components/SearchBar';
import Room from '../components/Room';
import MessageBar from '../components/MessageBar';
import RoomHeader from '../components/RoomHeader';
import CreateRoom from '../components/CreateRoom';
import '../scss/App.scss';

export default function MyProfilePage({ setLoginParent }) {
  const [user, setUser] = useState(null);
  const [activeList, setActiveList] = useState('rooms');
  const [loggedIn, setLogin] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [createRoom, setCreateRoom] = useState(false);
  const [roomMessages, setRoomMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState('test');
  const [SSE, setSSE] = useState('');
  const [invitations, setInvitations] = useState([]);

  let navigate = useNavigate();

  useEffect(() => {
    (async () => {
      await getMyProfile();
    })();
    const sse = new EventSource(`/api/sse`, {
      withCredentials: true,
    });
    sse.onopen = async (event) => {
      console.log('connected');
    };
    sse.addEventListener('new-message', (message) => {
      let data = JSON.parse(message.data);
      console.log(data);
      setRoomMessages((prevMessages) => [...prevMessages, data]);
    });

    sse.addEventListener('new-invitation', (invitation) => {
      let data = JSON.parse(invitation.data);
      console.log(data);
      setInvitations((prevInvitations) => [...prevInvitations, data]);
    });

    return () => {
      sse.close();
    };
  }, []);

  async function getMyProfile() {
    try {
      const response = await fetch('/api/myProfile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setUser(data.user);
      setLogin(data.loggedIn);
      setLoginParent(data.loggedIn);
      await getRooms();
      await getUsers();
      await getInvitations();
    } catch (error) {
      console.error(error.message);
    }
  }

  async function getUsers() {
    try {
      const response = await fetch('/api/users', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error(error.message);
    }
  }

  async function getRooms() {
    try {
      const response = await fetch('/api/rooms', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error(error.message);
    }
  }

  async function getRooms() {
    try {
      const response = await fetch('/api/rooms', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error(error.message);
    }
  }

  async function getMessages() {
    setRoomMessages([]);
    try {
      const response = await fetch(`/api/getAllMessages`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setRoomMessages(data);
    } catch (error) {
      console.error(error.message);
    }
  }

  async function joinRoom(room) {
    try {
      setSSE('');
      setRoomMessages([]);
      setRoom(room);

      const response = await fetch(`/api/enterRoom/${room.roomId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      let data = await response.json();
      user.moderator = data.moderator;
      await getMessages();
    } catch (error) {
      console.error(error);
    }
  }

  async function getInvitations() {
    try {
      const response = await fetch('/api/invitations', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      setInvitations(data);
    } catch (error) {
      console.error(error.message);
    }
  }

  async function logout() {
    try {
      const response = await fetch('api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      await response.json();

      setShowMessage(true);
      navigate('/');
    } catch (error) {}
  }

  return (
    <div className='container'>
      {loggedIn ? (
        <>
          <div className='main-veiw'>
            <div className='top-nav'>
              <>
                <h1>{user.name}</h1>
              </>
            </div>
            <div className='content'>
              <div className='message-list'>
                <SearchBar
                  rooms={rooms}
                  joinRoom={joinRoom}
                  users={users}
                  activeList={activeList}
                  setActiveList={setActiveList}
                  setInvitations={setInvitations}
                  invitations={invitations}
                />
                <div className='newRoom' onClick={() => setCreateRoom(true)}>
                  + New Room
                </div>
                <button className='login-btn' onClick={logout}>
                  Logout
                </button>
              </div>

              <div className='chat'>
                <div className='top'>
                  <RoomHeader room={room} user={user} users={users} />
                </div>

                <div className='message-container' id='message-container'>
                  {createRoom ? (
                    <CreateRoom
                      setCreateRoom={setCreateRoom}
                      joinRoom={joinRoom}
                      getRooms={getRooms}
                      users={users}
                    />
                  ) : (
                    <Room
                      room={room}
                      roomMessages={roomMessages}
                      setRoom={setRoom}
                      setRoomMessages={setRoomMessages}
                      setSSE={setSSE}
                      SSE={SSE}
                    />
                  )}
                </div>
                <MessageBar roomId={room.roomId} />
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <p>Please log in to view your profile</p>
          <button className='login-btn' onClick={() => navigate(`/`)}>
            Login
          </button>
        </>
      )}
      {''}
    </div>
  );
}
