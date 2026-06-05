import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // 1. Le decimos al servidor que esta ruta se renderiza SOLO en el cliente
  {
    path: 'collection/set/:id',
    renderMode: RenderMode.Client
  },
  // 2. El resto de la app que haga lo que tenga por defecto
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];