import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { 
  trigger, 
  style, 
  animate, 
  transition,
  query,
  stagger
} from '@angular/animations';

@Component({
  selector: 'app-add-restaurant',
  templateUrl: './add-restaurant.page.html',
  styleUrls: ['./add-restaurant.page.scss'],
  animations: [
    trigger('fadeInAnimation', [
      transition(':enter', [
        query('.animate-item', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('400ms ease-out', 
              style({ opacity: 1, transform: 'translateY(0)' })
            )
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class AddRestaurantPage implements OnInit {
  constructor(private router: Router) {}

  ngOnInit() {}

  navigateToHome() {
    this.router.navigate(['/business/home']);
  }
}