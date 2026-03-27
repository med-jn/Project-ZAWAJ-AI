import fs from 'fs';
import path from 'path';

const packageJsonPath = path.join(process.cwd(), 'package.json');
const gradlePath = path.join(process.cwd(), 'android', 'app', 'build.gradle');

function syncVersion() {
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ package.json not found');
    return;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const version = packageJson.version;

  if (!fs.existsSync(gradlePath)) {
    console.error('❌ build.gradle not found');
    return;
  }

  let gradleContent = fs.readFileSync(gradlePath, 'utf8');

  gradleContent = gradleContent.replace(/versionName\s+".*"/, `versionName "${version}"`);

  const versionCodeMatch = gradleContent.match(/versionCode\s+(\d+)/);
  if (versionCodeMatch) {
    const currentCode = parseInt(versionCodeMatch[1]);
    const newCode = currentCode + 1;
    gradleContent = gradleContent.replace(/versionCode\s+\d+/, `versionCode ${newCode}`);
    console.log(`✅ Version synced: ${version} (Code: ${newCode})`);
  }

  fs.writeFileSync(gradlePath, gradleContent);
}

syncVersion();