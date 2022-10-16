import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { WelcomePage } from "./welcome-page/welcome-page.component";
import { ProductsComponent } from "./products/products.component";
import { ReactiveFormsModule } from "@angular/forms";
import { NgxMaskModule } from "ngx-mask";
import { HttpClientModule } from "@angular/common/http";
import { ProductDetailsComponent } from "./product-details/product-details.component";
import { RouterModule } from "@angular/router";
import { NgxsModule } from "@ngxs/store";
import { NgxsStoragePluginModule } from "@ngxs/storage-plugin";
import { AuthState } from "./states/auth.state";
import { UserApiService } from "./services/user-api.service";
import { LoginGuard } from "./welcome-page/login.guard";

@NgModule({
  declarations: [
    AppComponent,
    WelcomePage,
    ProductsComponent,
    ProductDetailsComponent,
  ],
  imports: [
    NgxsModule.forRoot([AuthState], { developmentMode: true }),
    NgxsStoragePluginModule.forRoot({
      key: "auth.token",
    }),
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    NgxMaskModule.forRoot(),
    HttpClientModule,
    RouterModule.forRoot([
      { path: "", component: WelcomePage },
      { path: "welcome", component: WelcomePage, pathMatch: "full" },
      {
        path: "products",
        component: ProductsComponent,
        pathMatch: "full",
        canActivate: [LoginGuard],
      },
      { path: "products/:id", component: ProductDetailsComponent },
      { path: "**", redirectTo: "/welcome" },
    ]),
  ],
  providers: [UserApiService, LoginGuard],
  bootstrap: [AppComponent],
})
export class AppModule {}
