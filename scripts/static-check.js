const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const failures = [];
const notes = [];

function fail(message) { failures.push(message); }
function walk(directory, extension) {
    const results = [];
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        if (entry.name === 'node_modules' || entry.name === 'data') continue;
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) results.push(...walk(absolute, extension));
        else if (!extension || absolute.endsWith(extension)) results.push(absolute);
    }
    return results;
}

const requiredFiles = [
    'app.js',
    'src/models/User.js', 'src/models/Address.js', 'src/models/SellerProfile.js',
    'src/models/Category.js', 'src/models/Product.js', 'src/models/Cart.js',
    'src/models/CartItem.js', 'src/models/Order.js', 'src/models/OrderItem.js',
    'src/models/Review.js', 'src/models/OrderStatusHistory.js',
    'src/views/home.ejs', 'src/views/catalog/index.ejs', 'src/views/catalog/details.ejs',
    'src/views/cart/index.ejs', 'src/views/checkout/index.ejs',
    'src/views/orders/list.ejs', 'src/views/orders/details.ejs',
    'src/views/seller/dashboard.ejs', 'src/views/admin/dashboard.ejs',
    'public/js/cart.js', 'public/js/realtime.js', 'public/js/seller.js',
];
for (const relative of requiredFiles) {
    if (!fs.existsSync(path.join(root, relative))) fail(`Arquivo obrigatório ausente: ${relative}`);
}

const jsFiles = walk(root, '.js');
for (const file of jsFiles) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
    if (result.status !== 0) fail(`Erro de sintaxe em ${path.relative(root, file)}: ${result.stderr.trim()}`);
}

const viewRoot = path.join(root, 'src', 'views');
const ejsFiles = walk(viewRoot, '.ejs');
for (const file of ejsFiles) {
    const source = fs.readFileSync(file, 'utf8');
    if ((source.match(/<%/g) || []).length !== (source.match(/%>/g) || []).length) {
        fail(`Delimitadores EJS desequilibrados: ${path.relative(root, file)}`);
    }
}


const routeFiles = walk(path.join(root, 'src', 'routes'), '.js');
for (const file of routeFiles) {
    const source = fs.readFileSync(file, 'utf8');
    const controllerImports = new Map();
    for (const match of source.matchAll(/const\s+(\w+Controller)\s*=\s*require\(['"]\.\.\/controllers\/([^'"]+)['"]\)/g)) {
        controllerImports.set(match[1], path.join(root, 'src', 'controllers', `${match[2]}.js`));
    }
    for (const match of source.matchAll(/(\w+Controller)\.(\w+)/g)) {
        const controllerPath = controllerImports.get(match[1]);
        if (!controllerPath || !fs.existsSync(controllerPath)) {
            fail(`Controller não encontrado para ${match[1]} em ${path.relative(root, file)}`);
            continue;
        }
        const controllerSource = fs.readFileSync(controllerPath, 'utf8');
        const methodPattern = new RegExp(`static\\s+(?:async\\s+)?${match[2]}\\s*\\(`);
        if (!methodPattern.test(controllerSource)) {
            fail(`Método ${match[1]}.${match[2]} não existe (${path.relative(root, file)}).`);
        }
    }
}

const controllerFiles = walk(path.join(root, 'src', 'controllers'), '.js');
for (const file of controllerFiles) {
    const source = fs.readFileSync(file, 'utf8');
    const matches = source.matchAll(/renderComLayout\(\s*['"]([^'"]+)['"]/g);
    for (const match of matches) {
        const view = path.join(viewRoot, `${match[1]}.ejs`);
        if (!fs.existsSync(view)) fail(`View inexistente em ${path.relative(root, file)}: ${match[1]}`);
    }
}

const publicJs = walk(path.join(root, 'public', 'js'), '.js')
    .map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const ajaxCount = (publicJs.match(/\$\.ajax\s*\(|\$\.get\s*\(|\$\.post\s*\(|fetch\s*\(/g) || []).length;
const jqueryFeatureCount = (publicJs.match(/\.on\s*\(|\.fadeOut\s*\(|\.toggleClass\s*\(|\.html\s*\(|\.text\s*\(/g) || []).length;
const socketEvents = (publicJs.match(/socket\.on\s*\(/g) || []).length;
if (ajaxCount < 3) fail(`Há apenas ${ajaxCount} operações AJAX/fetch; o trabalho exige pelo menos 3.`);
if (jqueryFeatureCount < 5) fail(`Poucas manipulações jQuery detectadas: ${jqueryFeatureCount}.`);
if (socketEvents < 2) fail(`Há apenas ${socketEvents} eventos recebidos por Socket.IO; são esperadas duas funções em tempo real.`);

const layout = fs.readFileSync(path.join(viewRoot, 'layout.ejs'), 'utf8');
if (!/<main[^>]*>/.test(layout)) fail('A tag <main> do layout está malformada.');

notes.push(`${jsFiles.length} arquivos JavaScript verificados.`);
notes.push(`${ejsFiles.length} views EJS verificadas.`);
notes.push(`${ajaxCount} operações AJAX/fetch detectadas.`);
notes.push(`${socketEvents} eventos Socket.IO no cliente detectados.`);

if (failures.length) {
    console.error('Falhas na verificação estática:');
    failures.forEach((message) => console.error(`- ${message}`));
    process.exit(1);
}

console.log('Verificação estática concluída com sucesso.');
notes.forEach((message) => console.log(`- ${message}`));
console.log('Observação: esta verificação não substitui a execução local com npm install, banco e navegador.');
