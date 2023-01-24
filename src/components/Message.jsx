import { Container, Row, Col } from 'react-bootstrap';
import { BsFillTrashFill } from 'react-icons/bs';

const Message = ({
  text,
  sentByMe,
  sender,
  date,
  admin,
  messageId,
  roomId,
  deletedByAdmin,
  user,
}) => {
  async function deleteMessage(messageId) {
    await fetch('/api/deleteMessage', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messageId, roomId }),
    });
  }

  return (
    <Container>
      <Row>
        <Col xs={12}>
          <div
            className={`${sentByMe ? 'left-msg' : 'right-msg'} ${
              deletedByAdmin ? 'deleted-message' : ''
            }`}
          >
            <div
              className={`${sentByMe ? 'message-sender' : 'message-reciever'}`}
            >
              {user.role == 'admin' ? (
                <BsFillTrashFill
                  onClick={() => deleteMessage(messageId)}
                  className='trashcan'
                />
              ) : null}
              <p className={`${sentByMe ? 'sender' : 'reciever'}`}>{sender} </p>
              {admin ? <p className='adminTag'>Admin</p> : <></>}
              <p className='message-text'>{text}</p>
              <p className={`${sentByMe ? 'sender-time' : 'reciever-time'}`}>
                {date}
              </p>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
};
export default Message;
