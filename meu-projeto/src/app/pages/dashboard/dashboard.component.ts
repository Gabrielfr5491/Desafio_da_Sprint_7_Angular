import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, catchError, tap, map } from 'rxjs';
import { pluck } from 'rxjs/operators';
import { VehicleService, Veiculo, TelemetryData } from '../../services/vehicle.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly vehicleService = inject(VehicleService);
  private readonly authService = inject(AuthService);
  readonly themeService = inject(ThemeService);

  // Authentication Context
  currentUser = this.authService.currentUser;

  // Telemetry Search Subject
  private readonly vinSearchSubject = new Subject<any>();

  // State Signals
  vehicles = signal<Veiculo[]>([]);
  selectedVehicle = signal<Veiculo | null>(null);
  telemetryResult = signal<TelemetryData | null>(null);
  searchVinQuery = '';
  isSidebarActive = false;

  // Search Feedback states
  isSearchingTelemetry = signal(false);
  telemetryError = signal<string | null>(null);

  ngOnInit(): void {
    // 1. Fetch the list of vehicles from API
    this.vehicleService.getVehicles().subscribe({
      next: (data) => {
        this.vehicles.set(data.vehicles);
        if (data.vehicles.length > 0) {
          // Set default selected vehicle
          this.selectedVehicle.set(data.vehicles[0]);
        }
      },
      error: (err) => {
        console.error('Error fetching vehicles:', err);
      }
    });

    // 2. Setup the reactive search for vehicle telemetry using RxJS
    this.vinSearchSubject.pipe(
      // 2a. Use 'pluck' to extract the HTML Input target value from the DOM Event
      pluck('target', 'value'),
      // 2b. Use 'map' to trim the string value
      map((val: string) => val.trim()),
      // 2c. Use 'debounceTime' to wait 400ms after user finishes typing
      debounceTime(400),
      // 2d. Use 'filter' to only query when value has length > 0
      filter((val: string) => {
        const query = val.trim();
        if (query.length === 0) {
          this.telemetryResult.set(null);
          this.telemetryError.set(null);
          return false;
        }
        return true;
      }),
      // 2e. Use 'distinctUntilChanged' to prevent querying identical consecutive terms
      distinctUntilChanged(),
      // Trigger loader
      tap(() => {
        this.isSearchingTelemetry.set(true);
        this.telemetryError.set(null);
      }),
      // 2f. Use 'switchMap' to cancel previous queries and request backend
      switchMap((vin: string) => 
        this.vehicleService.getVehicleData(vin.trim()).pipe(
          catchError((err) => {
            this.isSearchingTelemetry.set(false);
            if (err.status === 400) {
              this.telemetryError.set('Código VIN utilizado não foi encontrado!');
            } else {
              this.telemetryError.set('Erro ao carregar dados do veículo.');
            }
            this.telemetryResult.set(null);
            // Return empty result to keep stream alive
            return [];
          })
        )
      )
    ).subscribe({
      next: (data) => {
        this.isSearchingTelemetry.set(false);
        this.telemetryResult.set(data);
      },
      error: (err) => {
        this.isSearchingTelemetry.set(false);
        console.error('Telemetry stream error:', err);
      }
    });
  }

  /**
   * Handle dropdown change for vehicle model selector
   */
  onVehicleChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const vehicleName = selectElement.value;
    const found = this.vehicles().find(v => v.vehicle === vehicleName);
    if (found) {
      this.selectedVehicle.set(found);
    }
  }

  /**
   * Push keyboard input event into the RxJS Subject stream
   */
  onSearchInput(event: Event): void {
    this.vinSearchSubject.next(event);
  }

  /**
   * Format numbers to local currency/unit pattern
   */
  formatNumber(val: number | string | undefined): string {
    if (val === undefined) return '0';
    return Number(val).toLocaleString('pt-BR');
  }

  /**
   * Quick action to search pre-defined VIN from prototype
   */
  fillExampleVin(vin: string): void {
    this.searchVinQuery = vin;
    // Simulate event object to push to subject
    const dummyEvent = {
      target: { value: vin }
    };
    this.vinSearchSubject.next(dummyEvent);
  }

  toggleSidebar(): void {
    this.isSidebarActive = !this.isSidebarActive;
  }

  onLogout(): void {
    this.authService.logout();
  }
}
