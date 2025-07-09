/// <reference types="vite/client" />

export {};
// Global type declarations for the development environment
declare global {
  interface Window {
    __VITE_DEV__: boolean;
  }
}