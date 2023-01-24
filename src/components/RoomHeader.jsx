const RoomHeader = ({ room }) => {
  return <>{room.roomName ? <p>{room.roomName}</p> : <></>}</>;
};

export default RoomHeader;
