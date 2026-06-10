/**
 * WEBSOCKET SERVICE
 * ══════════════════
 * Connects to your backend's WebSocket endpoint for real-time updates.
 * Replace WS_URL in environment.ts with your actual WebSocket endpoint.
 *
 * Expected message format from server:
 * { type: 'TROOP_UPDATE' | 'ALERT' | 'ENEMY_UPDATE' | 'SITUATION_UPDATE', payload: {...} }
 */

import { Injectable, OnDestroy } from '@angular/core';
import { Subject, interval, Subscription } from 'rxjs';
import { DataService } from './data.service';
import { environment } from '../../../environments/environment';

type WsMessageType = 'TROOP_UPDATE' | 'ALERT' | 'ENEMY_UPDATE' | 'SITUATION_UPDATE';

interface WsMessage {
  type: WsMessageType;
  payload: unknown;
}

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private socket: WebSocket | null = null;
  private reconnectSub?: Subscription;
  private readonly destroy$ = new Subject<void>();

  connected = false;

  constructor(private dataService: DataService) {
    // Auto-connect if WebSocket URL is configured
    if (environment.wsUrl) {
      this.connect();
    }
  }

  connect(): void {
    if (this.socket?.readyState === WebSocket.OPEN) return;

    try {
      this.socket = new WebSocket(environment.wsUrl || '');

      this.socket.onopen = () => {
        this.connected = true;
        console.log('[WS] Connected to', environment.wsUrl);
        this.reconnectSub?.unsubscribe();
      };

      this.socket.onmessage = (event) => {
        try {
          const msg: WsMessage = JSON.parse(event.data);
          this.handleMessage(msg);
        } catch (e) {
          console.warn('[WS] Failed to parse message', e);
        }
      };

      this.socket.onclose = () => {
        this.connected = false;
        console.log('[WS] Disconnected — reconnecting in 5s');
        this.scheduleReconnect();
      };

      this.socket.onerror = (err) => {
        console.error('[WS] Error', err);
      };
    } catch (e) {
      console.warn('[WS] Could not connect:', e);
    }
  }

  send(payload: unknown): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
    }
  }

  private handleMessage(msg: WsMessage): void {
    switch (msg.type) {
      case 'TROOP_UPDATE':
        this.dataService.pushTroopUpdate(msg.payload as any);
        break;
      case 'ALERT':
        this.dataService.pushAlert(msg.payload as any);
        break;
      case 'ENEMY_UPDATE':
        this.dataService.pushEnemyUpdate(msg.payload as any);
        break;
      case 'SITUATION_UPDATE':
        this.dataService.pushSituationUpdate(msg.payload as any);
        break;
    }
  }

  private scheduleReconnect(): void {
    this.reconnectSub = interval(5000).subscribe(() => this.connect());
  }

  disconnect(): void {
    this.socket?.close();
    this.reconnectSub?.unsubscribe();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}
