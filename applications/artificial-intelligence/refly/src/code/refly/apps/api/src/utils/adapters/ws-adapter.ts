import { WsAdapter } from '@nestjs/platform-ws';

export class CustomWsAdapter extends WsAdapter {
  constructor(
    app: any,
    protected port: number,
  ) {
    super(app);
  }

  create(_port: number, options?: any): any {
    const server = super.create(this.port, {
      cors: { origin: '*' },
      ...options,
    });
    return server;
  }
}
