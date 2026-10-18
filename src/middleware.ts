import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Continuar con la carga normal de la página
  const response = NextResponse.next()
  
  // 1. Atrapar el parámetro "?ref=" de la URL
  const refCode = request.nextUrl.searchParams.get('ref')
  
  if (refCode) {
    // 2. Si existe un referido, lo guardamos en una Cookie "estilo Hotmart"
    response.cookies.set({
      name: 'store_ref',
      value: refCode,
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // Dura 30 días (en segundos)
    })
  }
  
  return response
}

// 3. Esto evita que el código se ejecute en imágenes o archivos internos para que la tienda vuele de rápido
export const config = {
  matcher: '/((?!api|_next/static|_next/image|favicon.ico).*)',
}