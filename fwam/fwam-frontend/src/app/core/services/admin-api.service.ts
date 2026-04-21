import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SummaryResponse } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:5259/api/admin';

  /**
   * Obtém a lista global de jogadores (Online + Offline) via Banco de Dados com suporte a paginação.
   */
  getPlayers(page: number = 0, size: number = 50, search?: string): Observable<any> {
    let url = `${this.apiUrl}/players?page=${page}&size=${size}`;
    if (search) url += `&search=${search}`;
    return this.http.get<any>(url);
  }

  /**
   * Obtém o histórico recente de eventos para polling.
   */
  getEventHistory(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/events`);
  }

  /**
   * Obtém o resumo geral do estado do servidor.
   */
  getSummary(): Observable<SummaryResponse> {
    return this.http.get<SummaryResponse>(`${this.apiUrl}/summary`);
  }

  /**
   * Obtém a lista de itens reais do jogo via Bridge.
   */
  getGameItems(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/items`);
  }

  /**
   * Envia um comando genérico para o servidor Rust.
   */
  sendCommand(action: string, target: string = '', arg: string = ''): Observable<any> {
    const url = `${this.apiUrl}/command?action=${action}&target=${target}&arg=${arg}`;
    return this.http.post(url, {});
  }

  /**
   * Envia uma mensagem global para o chat do servidor.
   */
  broadcast(message: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/broadcast`, `"${message}"`, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Remove um jogador do servidor.
   */
  kick(uid: string, reason: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/kick/${uid}`, `"${reason}"`, {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  /**
   * Teleporta um jogador para uma localização ou outro jogador.
   */
  teleport(uid: string, targetOrCoords: string): Observable<any> {
    return this.sendCommand('TELEPORT', uid, targetOrCoords);
  }
}
