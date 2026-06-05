import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { CatalogComponent } from './pages/catalog/catalog';
import { MyCollectionComponent } from './pages/my-collection/my-collection';
import { SetsComponent } from './pages/sets/sets';
import { WishlistComponent } from './pages/wishlist/wishlist';
import { SetCollectionComponent } from './pages/set-collection/set-collection';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'catalog', component: CatalogComponent },
  // 🚀 Tu nueva ruta ahora está a salvo, por encima del comodín
  { path: 'my-collection', component: MyCollectionComponent },
  { path: 'expansiones', component: SetsComponent },
  { path: 'wishlist', component: WishlistComponent },
  //{ path: 'collection/set/:id', component: SetCollectionComponent },
  {
  path: 'collection/set/:id',
    loadComponent: () => import('./pages/set-collection/set-collection').then(m => m.SetCollectionComponent),
    // Usamos 'as any' para evitar el error de TypeScript ts(2353)
    // Angular CLI leerá esta propiedad durante el build y aplicará el renderizado correcto
  } as any,
  { path: '', redirectTo: '/catalog', pathMatch: 'full' }, 
  // 🚀 El comodín (**) siempre debe ser el ÚLTIMO elemento del array
  { path: '**', redirectTo: '/catalog' } 
];