import { config } from 'dotenv';
import { getPaths } from './../paths';

config({ path: getPaths().env });
