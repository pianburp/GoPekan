// dashboard.page.ts
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage implements OnInit {
  chartData = [
    {
      name: "Revenue",
      series: [
        { name: "Week 1", value: 2400 },
        { name: "Week 2", value: 1398 },
        { name: "Week 3", value: 9800 },
        { name: "Week 4", value: 3908 }
      ]
    }
  ];

  // Use a predefined color scheme name
  colorScheme = 'cool';

  constructor(private router: Router) {}

  ngOnInit() {}

  navigateToHome() {
    this.router.navigate(['business/home']);
  }

  onSelect(event: any) {
    console.log(event);
  }
}