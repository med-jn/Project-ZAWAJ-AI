import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

// تحديد مسار المجلد الناتج عن Next.js ومسار ملف الـ Zip
const outputDir = path.join(process.cwd(), 'out');
const zipFile = path.join(process.cwd(), 'public', 'app-dist.zip');

async function zipDirectory() {
  // التأكد من وجود مجلد out
  if (!fs.existsSync(outputDir)) {
    console.error('❌ Error: "out" folder not found. Run "npm run build" first.');
    return;
  }

  // إنشاء تيار الكتابة لملف الـ Zip
  const output = fs.createWriteStream(zipFile);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', () => {
    console.log(`✅ Success: Updated zip created at ${zipFile}`);
    console.log(`📦 Total size: ${(archive.pointer() / 1024 / 1024).toFixed(2)} MB`);
  });

  archive.on('error', (err) => { throw err; });

  archive.pipe(output);
  // إضافة محتويات مجلد out بالكامل داخل الـ Zip
  archive.directory(outputDir, false);
  await archive.finalize();
}

zipDirectory();