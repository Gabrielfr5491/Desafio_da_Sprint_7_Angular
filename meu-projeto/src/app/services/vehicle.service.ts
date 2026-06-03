import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Veiculo {
  id: number | string;
  vehicle: string;
  volumetotal: number;
  connected: number;
  softwareUpdates: number;
  img: string;
}

export interface VeiculosAPI {
  vehicles: Veiculo[];
}

export interface TelemetryData {
  id: number;
  odometro: number;
  nivelCombustivel: number;
  status: 'on' | 'off';
  lat: number;
  long: number;
}

@Injectable({
  providedIn: 'root'
})
export class VehicleService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3001';

  /**
   * Fetch list of all Ford vehicles from API
   */
  getVehicles(): Observable<VeiculosAPI> {
    return this.http.get<VeiculosAPI>(`${this.apiUrl}/vehicles`);
  }

  /**
   * Fetch telemetry data for a specific vehicle VIN code
   */
  getVehicleData(vin: string): Observable<TelemetryData> {
    return this.http.post<TelemetryData>(`${this.apiUrl}/vehicleData`, { vin });
  }
}
