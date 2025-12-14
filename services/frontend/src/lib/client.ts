import { treaty } from '@elysiajs/eden';
import type { App } from '../../../backend-api/src/index';

export const client = treaty<App>('localhost:8000');
