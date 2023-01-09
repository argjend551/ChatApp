import { v4 } from 'uuid';
import * as chatRepository from '../repository/Chat.js';
import { InvalidInputException } from '../exceptions/InvalidInputException.js';

let connections = [];

export const joinRoom = async (req, res) => {
  connections.push(res);

  req.on('close', () => {
    connections = connections.filter((openRes) => openRes != res);

    broadcast('disconnect', {
      message: 'client disconnected',
    });
  });

  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
  });
  broadcast('connect', {
    message: 'clients connected: ' + connections.length,
  });
};

function broadcast(event, data) {
  for (let connection of connections) {
    connection.res.write(
      'event:' + event + '\ndata:' + JSON.stringify(data) + '\n\n'
    );
  }
}
