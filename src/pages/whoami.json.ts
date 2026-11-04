import { whoami } from '../data/api';
import { jsonResponse } from '../lib/http';

export const GET = () => jsonResponse(whoami());
