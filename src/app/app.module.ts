import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { WelcomePage } from './welcome-page/welcome-page.component';
import { ProductsComponent } from './products/products.component';
import { ReactiveFormsModule } from '@angular/forms';
import { NgxMaskModule } from 'ngx-mask';
import { HttpClientModule } from '@angular/common/http';
import { ProductDetailsComponent } from './product-details/product-details.component';
import { RouterModule } from '@angular/router';
import { NgxsModule } from '@ngxs/store';

@NgModule({
  declarations: [
    AppComponent,
    WelcomePage,
    ProductsComponent,
    ProductDetailsComponent
  ],
  imports: [
    NgxsModule.forRoot([]),
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    NgxMaskModule.forRoot(),
    HttpClientModule,
    RouterModule.forRoot([
      { path: '', component: WelcomePage },
      { path: 'welcome', component: WelcomePage, pathMatch: 'full' },
      { path: 'products', component: ProductsComponent, pathMatch: 'full' },
      { path: 'details', component: ProductDetailsComponent },
      { path: '**', redirectTo: '/welcome' }
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
