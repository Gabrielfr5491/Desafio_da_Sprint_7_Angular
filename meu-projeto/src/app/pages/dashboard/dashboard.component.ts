import { Component, OnInit, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, catchError, tap, map } from 'rxjs';
import { VehicleService, Veiculo, TelemetryData } from '../../services/vehicle.service';
import { AuthService } from '../../services/auth.service';

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

  currentUser = this.authService.currentUser;

  private readonly vinSearchSubject = new Subject<any>();

  vehicles = signal<Veiculo[]>([]);
  selectedVehicle = signal<Veiculo | null>(null);
  telemetryResult = signal<TelemetryData | null>(null);
  searchVinQuery = '';

  isSidebarActive = false;
  isSidebarCollapsed = false;
  private readonly MOBILE_BREAKPOINT = 992;

  isSearchingTelemetry = signal(false);
  telemetryError = signal<string | null>(null);

  ngOnInit(): void {
    this.vehicleService.getVehicles().subscribe({
      next: (data) => {
        this.vehicles.set(data.vehicles);
        if (data.vehicles.length > 0) {
          this.selectedVehicle.set(data.vehicles[0]);
        }
      },
      error: (err) => {
        console.error('Error fetching vehicles:', err);
      }
    });

    this.vinSearchSubject.pipe(
      map((event: any) => (event?.target?.value || '').trim()),
      debounceTime(400),
      filter((val: string) => {
        if (val.length === 0) {
          this.telemetryResult.set(null);
          this.telemetryError.set(null);
          this.isSearchingTelemetry.set(false);
          return false;
        }
        return true;
      }),
      distinctUntilChanged(),
      tap(() => {
        this.isSearchingTelemetry.set(true);
        this.telemetryError.set(null);
      }),
      switchMap((vin: string) =>
        this.vehicleService.getVehicleData(vin).pipe(
          catchError((err) => {
            this.isSearchingTelemetry.set(false);

            if (err.status === 400) {
              this.telemetryError.set('Código VIN utilizado não foi encontrado!');
            } else {
              this.telemetryError.set('Erro ao carregar dados do veículo.');
            }

            this.telemetryResult.set(null);

            return of(null);
          })
        )
      )
    ).subscribe({
      next: (data) => {
        if (data) {
          this.telemetryResult.set(data);
          this.telemetryError.set(null);
        }
        this.isSearchingTelemetry.set(false);
      },
      error: (err) => {
        this.isSearchingTelemetry.set(false);
        console.error('Telemetry stream error:', err);
      }
    });
  }

  onVehicleChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const vehicleName = selectElement.value;
    const found = this.vehicles().find(v => v.vehicle === vehicleName);
    if (found) {
      this.selectedVehicle.set(found);
    }
  }

  onSearchInput(event: Event): void {
    this.vinSearchSubject.next(event);
  }

  formatNumber(val: number | string | undefined): string {
    if (val === undefined) return '0';
    return Number(val).toLocaleString('pt-BR');
  }

  fillExampleVin(vin: string): void {
    this.searchVinQuery = vin;
    const dummyEvent = {
      target: { value: vin }
    };
    this.vinSearchSubject.next(dummyEvent);
  }

  onLogout(): void {
    this.authService.logout();
  }

  toggleSidebar(): void {
    this.isSidebarActive = !this.isSidebarActive;
  }

  toggleCollapse(): void {
    this.isSidebarCollapsed = !this.isSidebarCollapsed;
  }

  onLogoClick(): void {
    if (this.isMobile()) {
      this.toggleSidebar();
    } else {
      this.toggleCollapse();
    }
  }

  private isMobile(): boolean {
    return window.innerWidth < this.MOBILE_BREAKPOINT;
  }

  @HostListener('window:resize')
  onResize(): void {
    if (!this.isMobile()) {
      this.isSidebarActive = false;
    } else {
      this.isSidebarCollapsed = false;
    }
  }
}