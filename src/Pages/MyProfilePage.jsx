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
  const [activeRoom, setActiveRoom] = useState('rooms');
  const [loggedIn, setLogin] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [createRoom, setCreateRoom] = useState(false);
  const [roomMessages, setRoomMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState('test');
  const [SSE, setSSE] = useState('');

  let navigate = useNavigate();

  useEffect(() => {
    (async () => {
      await getMyProfile();
      await getRooms();
      await getUsers();
    })();
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
      data[0] ? await joinRoom(data[0]) : null;
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

      const sse = new EventSource(`/api/sse/${room.roomId}`, {
        withCredentials: true,
      });
      sse.onopen = async () => {
        await getMessages();
        setSSE(sse);
      };

      sse.addEventListener('new-room-message', (message) => {
        let data = JSON.parse(message.data);
        setRoomMessages((prevMessages) => [...prevMessages, data]);
      });
    } catch (error) {
      console.error(error);
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
                  joinRoom={joinRoom}
                  rooms={rooms}
                  users={users}
                  activeList={activeList}
                  setActiveList={setActiveList}
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
                  <RoomHeader room={room} />
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
