declare module 'next' {
  export interface PageConfig {
    api?: {
      bodyParser?: boolean | {
        sizeLimit?: string | number;
      };
      externalResolver?: boolean;
    };
    runtime?: 'nodejs' | 'edge';
  }
} 