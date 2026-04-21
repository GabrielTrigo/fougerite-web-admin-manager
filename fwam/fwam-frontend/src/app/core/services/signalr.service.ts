import { Injectable, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection | undefined;
  public eventReceived$ = new Subject<any>();
  public connectionStatus = signal<'connected' | 'disconnected' | 'reconnecting'>('disconnected');

  constructor() {
    this.startConnection();
  }

  private startConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5259/hubs/events', {
          skipNegotiation: true,
          transport: signalR.HttpTransportType.WebSockets
      })
      .withAutomaticReconnect()
      .build();

    this.hubConnection
      .start()
      .then(() => {
        console.log('[FWAM SignalR] Conectado ao Hub!');
        this.connectionStatus.set('connected');
      })
      .catch(err => {
        console.error('[FWAM SignalR] Erro ao conectar:', err);
        this.connectionStatus.set('disconnected');
      });

    this.hubConnection.on('ReceiveEvent', (data) => {
      this.eventReceived$.next(data);
    });

    this.hubConnection.onreconnecting(() => this.connectionStatus.set('reconnecting'));
    this.hubConnection.onreconnected(() => this.connectionStatus.set('connected'));
    this.hubConnection.onclose(() => this.connectionStatus.set('disconnected'));
  }

  public stopConnection() {
    if (this.hubConnection) {
      this.hubConnection.stop();
    }
  }
}
