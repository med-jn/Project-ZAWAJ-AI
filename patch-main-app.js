/**
 * patch-main-app.js — ZAWAJ AI
 * يُشغَّل من جذر مشروع التطبيق:   node patch-main-app.js
 * يعدّل الملفات الحالية بنصوص دقيقة، ينسخ كل ملف إلى .bak قبل التعديل،
 * ويمكن تشغيله أكثر من مرة (يتخطى ما طُبّق).
 */
const fs = require('fs');
const path = require('path');
const ROOT = process.cwd();
let failed = 0;

function patch(file, steps) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) { console.log(`✗ ${file}: الملف غير موجود (شغّل السكربت من جذر المشروع)`); failed++; return; }
  const raw = fs.readFileSync(p, 'utf8');
  const crlf = raw.includes('\r\n');
  let s = raw.replace(/\r\n/g, '\n');
  let changed = false;
  for (const st of steps) {
    if (st.skipIf && s.includes(st.skipIf)) { console.log(`• ${file}: «${st.name}» مطبَّق مسبقًا`); continue; }
    if (!s.includes(st.find)) {
      if (st.optional) { console.log(`• ${file}: «${st.name}» غير موجود (تخطّي)`); continue; }
      console.log(`✗ ${file}: «${st.name}» لم أجد النص المطلوب — الملف تغيّر، أرسله لي`); failed++; continue;
    }
    s = s.replace(st.find, () => st.replace);
    changed = true;
    console.log(`✓ ${file}: ${st.name}`);
  }
  if (changed) {
    fs.copyFileSync(p, p + '.bak');
    fs.writeFileSync(p, crlf ? s.replace(/\n/g, '\r\n') : s, 'utf8');
  }
}

// ── 1) الجذر: تركيب المعالج العام ─────────────────────────────
patch('app/layout.tsx', [
  { name: 'import المعالج', skipIf: "import DeepLinkHandler",
    find: "import ClientLayout from '@/components/layout/ClientLayout';",
    replace: "import ClientLayout from '@/components/layout/ClientLayout';\nimport DeepLinkHandler from '@/components/system/DeepLinkHandler';" },
  { name: 'تركيب <DeepLinkHandler />', skipIf: '<DeepLinkHandler />',
    find: '        <ClientLayout>{children}</ClientLayout>',
    replace: '        <DeepLinkHandler />\n        <ClientLayout>{children}</ClientLayout>' },
]);

// ── 2) الصفحة الرئيسية: إزالة المعالجات القديمة + Cold Start الصحيح ──
patch('app/page.tsx', [
  { name: 'import أدوات الروابط', skipIf: 'consumeLaunchRoute',
    find: "import Footer                  from '@/components/layout/Footer';",
    replace: "import Footer                  from '@/components/layout/Footer';\nimport { consumeLaunchRoute, shouldNavigate } from '@/lib/notifications/deep-link';" },
  { name: 'حذف تعريف __navigateTo القديم', optional: true,
    find: "// نُسجّل دالة التنقل في window حتى يستطيع Java استدعاؤها (Warm Start)\nif (typeof window !== 'undefined') {\n  (window as any).__navigateTo = null; // سيُعيَّن بعد جاهزية router\n}\n\n",
    replace: "// [deep-link-patch] التنقل من الإشعارات صار في components/system/DeepLinkHandler.tsx\n\n" },
  { name: 'حذف تسجيل __navigateTo من الصفحة (كان يُلغى عند مغادرتها)', optional: true,
    find: "  // ── تسجيل __navigateTo فور جاهزية router ──────────────────\n  useEffect(() => {\n    if (typeof window === 'undefined') return;\n    (window as any).__navigateTo = (route: string) => {\n      if (route && route.startsWith('/')) {\n        router.push(route);\n      }\n    };\n    return () => { (window as any).__navigateTo = null; };\n  }, [router]);\n\n",
    replace: "" },
  { name: 'حذف Cold Start القديم (__pendingRoute فقط)', optional: true,
    find: "        // ✅ Cold Start: افحص window.__pendingRoute الذي وضعه MainActivity\n        if (Capacitor.getPlatform() === 'android') {\n          const pendingRoute = (window as any).__pendingRoute;\n          if (pendingRoute && pendingRoute.startsWith('/')) {\n            (window as any).__pendingRoute = null;\n            router.push(pendingRoute);\n            return;\n          }\n        }\n\n",
    replace: "" },
  { name: 'Cold Start من الإشعار (getLaunchUrl)', skipIf: 'await consumeLaunchRoute()',
    find: "          router.push(profile?.is_completed ? '/home' : '/onboarding');\n        } catch {\n          router.push('/home');\n        }",
    replace: "          // ✅ Cold Start من إشعار: /home أولًا (ليعمل زر الرجوع) ثم الصفحة المطلوبة\n          const launchRoute = await consumeLaunchRoute();\n          if (launchRoute && profile?.is_completed) {\n            router.replace('/home');\n            shouldNavigate(launchRoute);\n            setTimeout(() => router.push(launchRoute), 80);\n            return;\n          }\n          router.push(profile?.is_completed ? '/home' : '/onboarding');\n        } catch {\n          router.push('/home');\n        }" },
  { name: 'حذف فرع zawaj:// المكرر في appUrlOpen', optional: true,
    find: "      // ✅ Warm Start من إشعار: zawaj://app/chat/?id=X\n      try {\n        const uri   = new URL(url);\n        if (uri.protocol === 'zawaj:' && uri.hostname === 'app') {\n          const route = uri.pathname + uri.search;\n          if (route && route !== '/') router.push(route);\n        }\n      } catch (_) {}\n",
    replace: "" },
]);

// ── 3) صفحة الإشعارات: عرض العنوان والنص الكامل للإشعارات النظامية ──
patch('app/notifications/page.tsx', [
  { name: 'عرض عنوان الإشعار', skipIf: "n.title || 'إشعار'",
    find: "{n.sender?.full_name || 'إشعار'}",
    replace: "{n.sender?.full_name || n.title || 'إشعار'}" },
  { name: 'إظهار نص الإشعار النظامي كاملًا', skipIf: "n.type === 'system' ? 6 : 2",
    find: "WebkitLineClamp: 2,",
    replace: "WebkitLineClamp: n.type === 'system' ? 6 : 2," },
]);

// ── 4) الإشعار أثناء استخدام التطبيق: تنبيه بدل التحويل التلقائي ──
patch('hooks/usePushNotifications.ts', [
  { name: 'import toast', skipIf: "from 'sonner'",
    find: "import { Capacitor }         from '@capacitor/core';",
    replace: "import { Capacitor }         from '@capacitor/core';\nimport { toast }             from 'sonner';" },
  { name: 'تنبيه بدل router.push التلقائي', skipIf: 'action: route ?',
    find: "            if (route) router.push(route);",
    replace: "            // لا نُحوِّل المستخدم تلقائيًا أثناء استخدامه للتطبيق: تنبيه يضغط عليه إن أراد\n            toast((data as any).title || notification.title || 'إشعار جديد', {\n              description: (data as any).body || notification.body,\n              action: route ? { label: 'عرض', onClick: () => router.push(route) } : undefined,\n            });" },
]);

// ── 5) أندرويد: النقر على الإشعار يُرسل ACTION_VIEW فيُطلق Capacitor الحدث ──
patch('android/app/src/main/java/com/zawaj/ai/MyFirebaseMessagingService.java', [
  { name: 'Intent.ACTION_VIEW', skipIf: 'Intent.ACTION_VIEW',
    find: "intent.setData(Uri.parse(deepLink));",
    replace: "intent.setData(Uri.parse(deepLink));\n        intent.setAction(Intent.ACTION_VIEW); // يُطلق appUrlOpen في Capacitor" },
]);

console.log(failed ? `\n⚠️ ${failed} خطوة لم تُطبَّق — أرسل لي الأسطر أعلاه.` : '\n✅ اكتمل التعديل. الآن: npm run build ثم npx cap sync android');
process.exit(failed ? 1 : 0);
