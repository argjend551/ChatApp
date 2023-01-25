import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import UsersDropDown from './UsersDropDown';
import Alert from 'react-bootstrap/Alert';

const CreateRoom = ({ setCreateRoom, joinRoom, getRooms, users, setUsers }) => {
  const [roomName, setRoomName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);

  const [showMessage, setShowMessage] = useState({
    text: '',
    type: '',
  });
  const createRoom = async () => {
    try {
      const response = await fetch(`/api/createRoom`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomName,
        }),
      });
      let room = await response.json();
      console.log(room);
      await joinRoom(room);
      await getRooms();
      if (selectedUsers.length) await inviteToRoom(room.roomId);

      setShowMessage({
        text: 'Room Created!',
        type: 'success',
      });

      setTimeout(() => {
        setCreateRoom(false);
      }, 2000);
    } catch (error) {
      console.error(error);
    }
  };
  const inviteToRoom = async (roomId) => {
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
      console.log(selectedUsers);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className='modal' style={{ display: 'block', position: 'initial' }}>
      <Modal.Dialog>
        <Modal.Header>
          <Modal.Title>Create Room</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <form>
            <div className='RoomName'>
              <label>Room Name</label>
              <input
                type='text'
                className='form-control'
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
              />
            </div>
            <div className='form-group'>
              <label>Members</label>
              <UsersDropDown
                users={users}
                setSelectedUsers={setSelectedUsers}
                selectedUsers={selectedUsers}
                setUsers={setUsers}
              />
            </div>
          </form>
        </Modal.Body>

        <Modal.Footer>
          <Button variant='secondary' onClick={() => setCreateRoom()}>
            Close
          </Button>
          <Button variant='primary' onClick={() => createRoom()}>
            Create Room
          </Button>
        </Modal.Footer>
      </Modal.Dialog>
      {showMessage && (
        <div
          style={{
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            alignContent: 'center',
            width: '100%',
          }}
        >
          <Alert variant={showMessage.type}>{showMessage.text}</Alert>
        </div>
      )}
    </div>
  );
};

export default CreateRoom;
