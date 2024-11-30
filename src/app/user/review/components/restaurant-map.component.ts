import { Component, Input, OnInit, ElementRef, ViewChild } from '@angular/core';

declare var google: any;

@Component({
  selector: 'app-restaurant-map',
  template: `
    <div #mapContainer class="map-container"></div>
  `,
  styles: [`
    .map-container {
      width: 100%;
      height: 200px;
      margin: 16px 0;
      border-radius: 8px;
    }
  `]
})
export class RestaurantMapComponent implements OnInit {
  @ViewChild('mapContainer', { static: true }) mapContainer!: ElementRef;
  
  // Update Input decorators to handle undefined values
  @Input() set latitude(value: number | undefined) {
    this._latitude = value ?? 0; // Use nullish coalescing to provide default
  }
  get latitude(): number {
    return this._latitude;
  }

  @Input() set longitude(value: number | undefined) {
    this._longitude = value ?? 0;
  }
  get longitude(): number {
    return this._longitude;
  }

  @Input() restaurantName: string = '';

  private _latitude: number = 0;
  private _longitude: number = 0;
  private map: any;

  ngOnInit() {
    this.initMap();
  }

  private initMap(): void {
    // Only initialize map if we have valid coordinates
    if (this._latitude === 0 && this._longitude === 0) {
      console.warn('No valid coordinates provided');
      return;
    }

    const coordinates = { lat: this._latitude, lng: this._longitude };
    
    const mapOptions = {
      center: coordinates,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      disableDefaultUI: true,
      zoomControl: true
    };

    this.map = new google.maps.Map(this.mapContainer.nativeElement, mapOptions);

    new google.maps.Marker({
      position: coordinates,
      map: this.map,
      title: this.restaurantName
    });
  }
}