// types/cookie.d.ts
declare module 'cookie' {
  export interface CookieSerializeOptions {
    domain?: string;
    encode?(value: string): string;
    expires?: Date;
    httpOnly?: boolean;
    maxAge?: number;
    path?: string;
    sameSite?: boolean | 'lax' | 'strict' | 'none';
    secure?: boolean;
  }

  export function serialize(name: string, value: string, options?: CookieSerializeOptions): string;
  export function parse(cookie: string): { [key: string]: string };
}