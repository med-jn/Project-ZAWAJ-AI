import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const version = packageJson.version;
const outputDir = path.join(process.cwd(), 'out');
const publicDir = path.join(process.cwd(), 'public');
const zipFile = path.join(publicDir, 'app-dist.zip');
const updateJsonFile = path.join(publicDir, 'update-info.json');

async function zipDirectory() {
  if (!fs.existsSync(outputDir)) {
    console.error('❌ Error: "out" folder not found. Run "next build" first.');
    return;
  }

  const updateInfo = {
    version: version,
    url: "https://zawaj-ai.vercel.app/app-dist.zip",
    timestamp: new Date().toISOString()
  };
  
  fs.writeFileSync(updateJsonFile, JSON.stringify(updateInfo, null, 2));

  if (fs.existsSync(zipFile)) {
    fs.unlinkSync(zipFile);
  }

  const output = fs.createWriteStream(zipFile);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    console.log(`✅ Success: v${version} created at ${zipFile}`);
    console.log(`📦 Size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
  });

  archive.on('error', (err) => { throw err; });

  archive.pipe(output);
  archive.directory(outputDir, false);
  await archive.finalize();
}

zipDirectory();