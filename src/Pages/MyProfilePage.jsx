import React, { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Alert, Button } from 'react-bootstrap';
import Message from '../components/Message';
import { CSSTransition } from 'react-transition-group';

import Room from '../components/Room';
import '../scss/App.scss';
import MessageBar from '../components/MessageBar';
import RoomHeader from '../components/RoomHeader';

export default function MyProfilePage({ setLoginParent }) {
  const [user, setUser] = useState(null);
  const [loggedIn, setLogin] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [roomMessages, setRoomMessages] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [room, setRoom] = useState('');
  const [SSE, setSSE] = useState('');
  const [isRoomReady, setIsRoomReady] = useState(false);
  const [message, setMessage] = useState({
    text: '',
    type: '',
  });
  let navigate = useNavigate();

  useEffect(() => {
    getMyProfile();
    getRooms();
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
      if (!response.ok) {
        throw new Error(response.statusText);
      }
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
      if (SSE) setSSE('');
      setRoomMessages([]);

      const sse = new EventSource(`/api/sse/${room.roomId}`, {
        withCredentials: true,
      });
      const connectPromise = new Promise((resolve) => {
        sse.addEventListener('connect', (message) => {
          let data = JSON.parse(message.data);
          console.log('[connect]', data);
          resolve();
        });
      });

      sse.addEventListener('disconnect', (message) => {
        let data = JSON.parse(message.data);
        console.log('[disconnect]', data);
      });

      sse.addEventListener('new-room-message', (message) => {
        let data = JSON.parse(message.data);
        // console.log('[new-private-message]', data);
        // console.log('hi');
        // setRoomMessages((prevMessages) => [...prevMessages, data]);
        // console.log(roomMessages);
      });

      await connectPromise;
      getMessages().finally(() => {
        setRoom(room);
        setSSE(sse);
        console.log(room);
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
      const data = await response.json();
      setMessage({
        text: data.message,
        type: 'Success',
      });
      setShowMessage(true);
      navigate('/');
    } catch (error) {
      setMessage({
        text: error.message,
        type: 'Danger',
      });
    }
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
                <div className='list-top'>
                  <input type='text' />
                  <button className='search'>
                    <i className='fa fa-search' />
                  </button>
                  <button className='add'>+</button>
                </div>
                <p>My rooms</p>
                {rooms.map((x, i) => (
                  <div
                    className='room'
                    key={i}
                    onClick={() => {
                      joinRoom(x);
                    }}
                  >
                    {x.roomName}
                  </div>
                ))}
                <button className='login-btn' onClick={logout}>
                  Logout
                </button>
              </div>
              <div className='chat'>
                <div className='top'>
                  <RoomHeader />
                </div>
                <div className='message-container' id='message-container'>
                  <Room
                    room={room}
                    roomMessages={roomMessages}
                    setRoom={setRoom}
                    setRoomMessages={setRoomMessages}
                    setSSE={setSSE}
                    SSE={SSE}
                  />
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

  // <Container className='test'>
  //   <Container className={room ? 'hide-login-container' : 'login-container'}>
  //     <Row>
  //       <Col xs={12}>
  //         {showMessage && (
  //           <Alert variant={message.type}>{message.text}</Alert>
  //         )}
  //       </Col>
  //     </Row>
  //     <Row>
  //       <Col xs={12}>
  //         {loggedIn ? (
  //           <>
  //             <h1>{user.email}</h1>
  //             <Button variant='secondary' onClick={logout}>
  //               Logout
  //             </Button>
  //           </>
  //         ) : (
  //           <>
  //             <p>Please log in to view your profile</p>
  //             <Button variant='secondary' onClick={() => navigate(`/`)}>
  //               Login
  //             </Button>
  //           </>
  //         )}
  //       </Col>
  //     </Row>
  //     <Row>
  //       <Col xs={12}>
  //         <h2>My rooms</h2>
  //         {rooms.map((room, i) => (
  //           <div
  //             className='room'
  //             key={i}
  //             onClick={() => {
  //               joinRoom(room);
  //             }}
  //           >
  //             {room.roomName}
  //           </div>
  //         ))}
  //       </Col>
  //     </Row>
  //   </Container>
  //   {room && (
  //     <Room
  //       room={room}
  //       roomMessages={roomMessages}
  //       setSSE={setSSE}
  //       SSE={SSE}
  //       setRoom={setRoom}
  //       setRoomMessages={setRoomMessages}
  //     />
  //   )}
  // </Container>
}
