import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import RoomMembersDropdown from '../components/RoomMembersDropDown';
import SearchBar from '../components/SearchBar';
import Room from '../components/Room';
import MessageBar from '../components/MessageBar';
import RoomHeader from '../components/RoomHeader';
import CreateRoom from '../components/CreateRoom';
import { BsFillChatDotsFill } from 'react-icons/bs';
import '../scss/App.scss';

const MyProfilePage = ({ setLoginParent, loggedIn }) => {
  const [user, setUser] = useState(null);
  const [activeList, setActiveList] = useState('rooms');
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

    let sse = new EventSource(`/api/sse`, {
      withCredentials: true,
      reconnect: true,
    });

    sse.addEventListener('new-message', (message) => {
      let data = JSON.parse(message.data);
      setRoomMessages((prevMessages) => [...prevMessages, data]);
    });

    sse.addEventListener('new-invitation', (invitation) => {
      let data = JSON.parse(invitation.data);
      setInvitations((prevInvitations) => [...prevInvitations, data]);
    });
    sse.addEventListener('delete-message', (message) => {
      let messageId = message.data;

      setRoomMessages((prevMessages) => {
        let updatedMessage = prevMessages.map((message) => {
          if (message.id === messageId) {
            return {
              ...message,
              message: 'This message was deleted by an admin',
              deleted_by_admin: true,
            };
          }
          return message;
        });
        return [...updatedMessage];
      });
    });

    sse.addEventListener('join-room', (data) => {
      let newMember = JSON.parse(data.data);
      setMembers((prevMembers) => [...prevMembers, newMember]);
    });

    sse.addEventListener('ban', (ban) => {
      setBanned(true);
    });
    sse.onclose = () => {
      sse = new EventSource('/api/sse', {
        withCredentials: true,
      });
    };
  }, [loggedIn]);

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

      setLoginParent(data.loggedIn);
      if (!data.user) return;
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
    } catch (error) {
      console.error(error);
    } finally {
      await getMessages();
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

  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width]);

  useEffect(() => {
    if (width < 600) {
      setShowLeftBar(false);
    } else {
      setShowLeftBar(true);
    }
  }, [width]);

  return (
    <div className='container'>
      {loggedIn ? (
        <>
          <div className='main-veiw'>
            <div className='top-nav'>
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
                <h4 className='nameTag'>{user.name}</h4>
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
                  setLoginParent={setLoginParent}
                />
              </div>
              <div className='chat'>
                <div className='top'>
                  <RoomHeader room={room} user={user} users={users} />
                </div>

                <div
                  className={`${
                    room ? 'message-container' : 'message-container-noRoom'
                  }`}
                  id='message-container'
                >
                  {Object.keys(room).length && !banned ? (
                    <RoomMembersDropdown
                      room={room}
                      members={members}
                      setMembers={setMembers}
                      user={user}
                      users={users}
                      setUsers={setUsers}
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
                      setUsers={setUsers}
                    />
                  ) : (
                    <Room
                      room={room}
                      roomMessages={roomMessages}
                      setRoom={setRoom}
                      setRoomMessages={setRoomMessages}
                      banned={banned}
                      user={user}
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
          <Button className='login-btn' onClick={() => navigate(`/`)}>
            Login
          </Button>
        </>
      )}
      {''}
    </div>
  );
};
export default MyProfilePage;
