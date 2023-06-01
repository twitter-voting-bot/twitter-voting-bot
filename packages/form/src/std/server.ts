import http from 'http';

/**
 * Used for starting a server so we can log the user in
 */
const server = {
  start: (
    handler: (
      request: http.IncomingMessage,
      response: http.ServerResponse
    ) => void,
    port: number = 3000
  ): Promise<() => void> => {
    const server = http.createServer(handler);

    return new Promise((resolve, reject) => {
      server.listen(port, () => {
        resolve(() => {
          server.close();
        });
      });
    });
  },
};

export default server;
