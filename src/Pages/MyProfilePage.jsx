import React, { useState } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Alert, Button } from 'react-bootstrap';
import RoomMembersDropdown from '../components/RoomMembersDropDown';
import SearchBar from '../components/SearchBar';
import Room from '../components/Room';
import MessageBar from '../components/MessageBar';
import RoomHeader from '../components/RoomHeader';
import CreateRoom from '../components/CreateRoom';
import { BsFillChatDotsFill } from 'react-icons/bs';
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
  const [room, setRoom] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [banned, setBanned] = useState(false);
  const [members, setMembers] = useState([]);
  const [showLeftBar, setShowLeftBar] = useState(true);

  let navigate = useNavigate();

  useEffect(() => {
    (async () => {
      await getMyProfile();
      if (window.innerWidth < 640) {
        setShowLeftBar(false);
      }
    })();
    let sse;
    // Check if SSE is already stored in local storage
    const storedSSE = localStorage.getItem('sse');

    if (storedSSE) {
      sse = JSON.parse(storedSSE);
    } else {
      // If not, create a new one
      sse = new EventSource(`/api/sse`, {
        withCredentials: true,
      });
      // Store it in local storage
      localStorage.setItem('sse', JSON.stringify(sse));
    }

    // sse.onopen = async (event) => {
    //   console.log('connected');
    // };
    // sse.addEventListener('new-message', (message) => {
    //   let data = JSON.parse(message.data);
    //   setRoomMessages((prevMessages) => [...prevMessages, data]);
    // });

    // sse.addEventListener('new-invitation', (invitation) => {
    //   let data = JSON.parse(invitation.data);
    //   setInvitations((prevInvitations) => [...prevInvitations, data]);
    // });

    // sse.addEventListener('ban', (ban) => {
    //   setBanned(true);
    // });

    // return () => {
    //   sse.close();
    // };
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
      if (data && data.status == 403) {
        return setBanned(true);
      }
      user.moderator = data;
      setBanned(false);
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
              <button className='login-btn' onClick={logout}>
                Logout
              </button>
              <div className='showChats-wrapper'>
                <BsFillChatDotsFill
                  className='showChats'
                  onClick={() => setShowLeftBar(!showLeftBar)}
                >
                  Toggle
                </BsFillChatDotsFill>
              </div>
            </div>
            <div className='content'>
              <div
                className={`${
                  showLeftBar ? 'message-list' : 'message-list-hide'
                }`}
              >
                <SearchBar
                  rooms={rooms}
                  joinRoom={joinRoom}
                  users={users}
                  activeList={activeList}
                  setActiveList={setActiveList}
                  setInvitations={setInvitations}
                  setCreateRoom={setCreateRoom}
                  invitations={invitations}
                  getRooms={getRooms}
                />
              </div>
              <div className='chat'>
                <div className='top'>
                  <RoomHeader room={room} user={user} users={users} />
                </div>

                <div className='message-container' id='message-container'>
                  {room ? (
                    <RoomMembersDropdown
                      room={room}
                      members={members}
                      setMembers={setMembers}
                      user={user}
                    />
                  ) : (
                    <></>
                  )}
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
                      banned={banned}
                    />
                  )}
                </div>
                <MessageBar roomId={room.roomId} banned={banned} />
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
