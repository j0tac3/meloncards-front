import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { CatalogComponent } from './pages/catalog/catalog';
import { MyCollectionComponent } from './pages/my-collection/my-collection';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'catalog', component: CatalogComponent },
  // 🚀 Tu nueva ruta ahora está a salvo, por encima del comodín
  { path: 'my-collection', component: MyCollectionComponent },
  { path: '', redirectTo: '/catalog', pathMatch: 'full' }, 
  // 🚀 El comodín (**) siempre debe ser el ÚLTIMO elemento del array
  { path: '**', redirectTo: '/catalog' } 
];