import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import UsersDropDown from './UsersDropDown';
import Alert from 'react-bootstrap/Alert';

const CreateRoom = ({ setCreateRoom, joinRoom, getRooms }) => {
  const [roomName, setRoomName] = useState('');
  const [members, setMembers] = useState('');
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
      await joinRoom(room);
      await getRooms();
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

  return (
    <div className='modal' style={{ display: 'block', position: 'initial' }}>
      <Modal.Dialog>
        <Modal.Header>
          <Modal.Title>Create Room</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <form>
            <div className='form-group'>
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
              <UsersDropDown />
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