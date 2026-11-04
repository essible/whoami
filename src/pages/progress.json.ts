import { progress } from '../data/api';
import { jsonResponse } from '../lib/http';

export const GET = () => jsonResponse(progress());
