import fs   from 'fs';
import path from 'path';

const packageJsonPath  = path.join(process.cwd(), 'package.json');
const gradlePath       = path.join(process.cwd(), 'android', 'app', 'build.gradle');
const updateInfoPath   = path.join(process.cwd(), 'public', 'update-info.json');

function syncVersion() {
  // ═══ قراءة الإصدار من package.json ═══
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json غير موجود');
    return;
  }
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version     = packageJson.version;

  // ═══ تحديث build.gradle ═══
  if (!fs.existsSync(gradlePath)) {
    console.error('❌ build.gradle غير موجود');
    return;
  }

  let gradle = fs.readFileSync(gradlePath, 'utf8');
  gradle     = gradle.replace(/versionName\s+".*"/, `versionName "${version}"`);

  const match = gradle.match(/versionCode\s+(\d+)/);
  if (match) {
    const newCode = parseInt(match[1]) + 1;
    gradle        = gradle.replace(/versionCode\s+\d+/, `versionCode ${newCode}`);
    console.log(`✅ build.gradle → v${version} (code: ${newCode})`);
  }
  fs.writeFileSync(gradlePath, gradle);

  // ═══ تحديث update-info.json ═══
  const updateInfo = {
    version,
    url:       'https://zawaj-ai.vercel.app/app-dist.zip',
    timestamp: new Date().toISOString(),
  };
  fs.writeFileSync(updateInfoPath, JSON.stringify(updateInfo, null, 2));
  console.log(`✅ update-info.json → v${version}`);
}

syncVersion();