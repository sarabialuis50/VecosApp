const fs = require('fs');
const path = require('path');

function renameRecursive(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            renameRecursive(fullPath);
        } else if (fullPath.endsWith('.js')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('<') && (content.includes('React') || content.includes('export') || content.includes('import'))) {
                const newPath = fullPath.replace(/\.js$/, '.jsx');
                console.log(`Renaming ${fullPath} to ${newPath}`);
                fs.renameSync(fullPath, newPath);
            }
        }
    });
}

['src/components', 'src/pages', 'src/layouts', 'src/context'].forEach(renameRecursive);
