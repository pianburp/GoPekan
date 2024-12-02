import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./register/register.module').then( m => m.RegisterPageModule)
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'forgot-password',
    loadChildren: () => import('./forgot-password/forgot-password.module').then( m => m.ForgotPasswordPageModule)
  },
  {
    path: 'user/home',
    loadChildren: () => import('./user/home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'user/profile',
    loadChildren: () => import('./user/profile/profile.module').then( m => m.ProfilePageModule)
  },
  {
    path: 'business/home',
    loadChildren: () => import('./business-owner/home/home.module').then( m => m.HomePageModule)
  },
  {
    path: 'business/profile',
    loadChildren: () => import('./business-owner/profile/profile.module').then( m => m.ProfilePageModule)
  },
  {
    path: 'business/dashboard',
    loadChildren: () => import('./business-owner/dashboard/dashboard.module').then( m => m.DashboardPageModule)
  },
  {
    path: 'business/add-restaurant',
    loadChildren: () => import('./business-owner/add-restaurant/add-restaurant.module').then( m => m.AddRestaurantPageModule)
  },
  {
    path: 'user/review/:id',
    loadChildren: () => import('./user/review/review.module').then( m => m.ReviewPageModule)
  },
  {
    path: 'user/add-review',
    loadChildren: () => import('./user/add-review/add-review.module').then( m => m.AddReviewPageModule)
  },
  {
    path: 'business/edit-restaurant/:id',
    loadChildren: () => import('./business-owner/edit-restaurant/edit-restaurant.module').then( m => m.EditRestaurantPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }