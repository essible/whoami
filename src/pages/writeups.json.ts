import { writeups } from '../data/api';
import { jsonResponse } from '../lib/http';

export const GET = async () => jsonResponse(await writeups());
