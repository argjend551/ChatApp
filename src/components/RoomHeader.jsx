const RoomHeader = ({ room }) => {
  return <>{room.roomName ? <h2>{room.roomName}</h2> : <></>}</>;
};

export default RoomHeader;
