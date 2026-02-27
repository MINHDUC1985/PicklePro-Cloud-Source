import { execSync } from 'child_process';
import fs from 'fs';
try {
    execSync('npm run build:win', { encoding: 'utf-8', stdio: 'pipe' });
} catch (error) {
    fs.writeFileSync('build_error.log', error.stderr || error.stdout);
}
