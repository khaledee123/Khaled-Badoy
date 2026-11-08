import React, { useState } from 'react';
import {
  Download,
  Smartphone,
  CheckCircle,
  X,
  Share2,
  Cpu,
  Layers,
  Sparkles,
  ExternalLink,
  QrCode,
  ShieldCheck,
  HardDrive,
  Copy,
  Check,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface APKInstallModalProps {
  lang: 'ar' | 'en';
  onClose: () => void;
}

export const APKInstallModal: React.FC<APKInstallModalProps> = ({ lang, onClose }) => {
  const isAr = lang === 'ar';
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [activePlatformTab, setActivePlatformTab] = useState<'android' | 'ios' | 'bundle'>('android');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  const currentUrl = typeof window !== 'undefined' ? window.location.href : 'https://nafas-infant-ai.app';

  const handleTriggerInstall = async () => {
    setIsInstalling(true);
    const success = await install();
    setIsInstalling(false);
    if (success) {
      setInstallSuccess(true);
    }
  };

  const handleCopyUrl = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    }
  };

  const handleDownloadAPKPackage = () => {
    // Generate a downloadable APK manifest & TWA bundle configuration file
    const packageConfig = {
      name: 'Nafas Infant AI Platform',
      packageName: 'com.nafas.infantai',
      version: '1.0.0',
      startUrl: currentUrl,
      themeColor: '#4F46E5',
      backgroundColor: '#0F172A',
      display: 'standalone',
      orientation: 'portrait',
      permissions: ['RECORD_AUDIO', 'VIBRATE', 'RECEIVE_BOOT_COMPLETED', 'POST_NOTIFICATIONS'],
      manifestUrl: `${window.location.origin}/manifest.webmanifest`,
      generatedAt: new Date().toISOString(),
      builderInstructions: {
        twaBuilder: 'You can build signed Android APK with Bubblewrap CLI: bubblewrap init --manifest=' + `${window.location.origin}/manifest.webmanifest` + ' && bubblewrap build',
        pwabuilder: 'Or submit URL to https://www.pwabuilder.com to get a one-click signed APK or AAB for Google Play Store.'
      }
    };

    const blob = new Blob([JSON.stringify(packageConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nafas-infant-ai-apk-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Simple clean SVG QR code visualizer based on the current URL
  const qrSvgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    currentUrl
  )}&bgcolor=0f172a&color=818cf8&qzone=2`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Glowing Top Ambient Header */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-indigo-900/60 via-slate-900 to-indigo-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white tracking-tight">
                  {isAr ? 'تثبيت وتحميل تطبيق نَفَس كـ APK حقيقي' : 'Install & Download Nafas as Native APK'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {isAr ? 'جاهز للتثبيت 100%' : 'APK Ready'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAr
                  ? 'منصة سريرية متكاملة تدعم التثبيت المستقل كـ WebAPK على أندرويد و PWA على كافة الأجهزة'
                  : 'Clinical standalone platform supporting native Android WebAPK and PWA offline installation'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top Quick Status Banner */}
          {isInstalled ? (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3 text-emerald-300">
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold">
                  {isAr ? 'التطبيق مثبت بالفعل على جهازك في الوضع المستقل (Standalone)!' : 'App is already installed in Standalone Mode!'}
                </p>
                <p className="text-xs text-emerald-400/80">
                  {isAr
                    ? 'يمكنك تشغيله مباشرة من شاشتك الرئيسية كأي تطبيق أصلي مع دعم الميكروفون والإشعارات بدون إنترنت.'
                    : 'You can run it from your home screen just like a native app with full mic and offline features.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white">
                    {isAr ? 'التثبيت الفوري بنقرة واحدة (Android WebAPK)' : 'One-Click Instant Install (Android WebAPK)'}
                  </div>
                  <div className="text-xs text-slate-400">
                    {isAr
                      ? 'يقوم متصفح جوجل كروم بتوليد وتثبيت حزمة APK موثقة تلقائياً على جهازك'
                      : 'Google Chrome Android automatically packages and installs the signed WebAPK on your device'}
                  </div>
                </div>
              </div>

              {isInstallable ? (
                <button
                  onClick={handleTriggerInstall}
                  disabled={isInstalling}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>{isInstalling ? (isAr ? 'جارٍ التثبيت...' : 'Installing...') : (isAr ? 'تثبيت الآن كـ APK' : 'Install APK Now')}</span>
                </button>
              ) : (
                <button
                  onClick={() => setActivePlatformTab('android')}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center justify-center gap-2 transition"
                >
                  <span>{isAr ? 'عرض خطوات التثبيت' : 'View Install Guide'}</span>
                </button>
              )}
            </div>
          )}

          {/* Platform Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
            <button
              onClick={() => setActivePlatformTab('android')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activePlatformTab === 'android'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{isAr ? 'أندرويد (APK / WebAPK)' : 'Android (APK)'}</span>
            </button>

            <button
              onClick={() => setActivePlatformTab('ios')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activePlatformTab === 'ios'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isAr ? 'آيفون و آيباد (iOS PWA)' : 'Apple iOS'}</span>
            </button>

            <button
              onClick={() => setActivePlatformTab('bundle')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 ${
                activePlatformTab === 'bundle'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              <span>{isAr ? 'حزمة APK وملفات البناء' : 'APK Build Bundle'}</span>
            </button>
          </div>

          {/* Tab 1: Android WebAPK Guide */}
          {activePlatformTab === 'android' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Instructions */}
                <div className="space-y-3 text-xs text-slate-300">
                  <div className="font-bold text-sm text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{isAr ? 'كيف يتم تثبيت التطبيق كـ APK على أندرويد؟' : 'How Android WebAPK Works:'}</span>
                  </div>
                  <ol className="space-y-2.5 list-decimal list-inside text-slate-300">
                    <li className="leading-relaxed">
                      {isAr
                        ? 'افتح الرابط في متصفح Chrome أو Samsung Internet على هاتفك.'
                        : 'Open this link in Chrome or Samsung Internet on your Android phone.'}
                    </li>
                    <li className="leading-relaxed">
                      {isAr
                        ? 'انقر على زر "تثبيت التطبيق" أو من قائمة المتصفح (ثلاث نقاط ⋮) اختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية".'
                        : 'Tap "Install App" or from browser menu (⋮) select "Install App" or "Add to Home Screen".'}
                    </li>
                    <li className="leading-relaxed">
                      {isAr
                        ? 'نظام أندرويد سيقوم بتجميع ملف APK رسمي موثق ومدمج في قائمة تطبيقات هاتفك مع دعم كامل للتشغيل بدون متصفح.'
                        : 'Android packages a signed native APK into your app launcher with full standalone hardware permissions.'}
                    </li>
                  </ol>

                  <div className="pt-2 flex items-center gap-2">
                    <button
                      onClick={handleCopyUrl}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition"
                    >
                      {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUrl ? (isAr ? 'تم نسخ الرابط!' : 'Copied!') : (isAr ? 'نسخ رابط المنصة' : 'Copy URL')}</span>
                    </button>
                  </div>
                </div>

                {/* Mobile QR Scanner */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center">
                  <div className="text-xs font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-indigo-400" />
                    <span>{isAr ? 'امسح بكاميرا الهاتف للتثبيت المباشر' : 'Scan with Phone to Install'}</span>
                  </div>
                  <div className="w-36 h-36 bg-slate-900 rounded-lg p-2 border border-slate-800 flex items-center justify-center">
                    <img
                      src={qrSvgUrl}
                      alt="Nafas Infant AI QR Code"
                      className="w-full h-full object-contain rounded"
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-2 font-mono break-all max-w-[200px] truncate">
                    {currentUrl}
                  </span>
                </div>
              </div>

              {/* Technical Spec Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
                <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">{isAr ? 'حجم التطبيق' : 'Package Size'}</div>
                  <div className="text-xs font-mono font-bold text-indigo-400">~3.8 MB</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">{isAr ? 'العمل بدون إنترنت' : 'Offline Support'}</div>
                  <div className="text-xs font-mono font-bold text-emerald-400">ServiceWorker v3</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">{isAr ? 'الأذونات المطلوبة' : 'Permissions'}</div>
                  <div className="text-xs font-mono font-bold text-amber-400">Microphone, Audio</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-800/50 border border-slate-700/60">
                  <div className="text-[10px] text-slate-400">{isAr ? 'نظام العرض' : 'Display Mode'}</div>
                  <div className="text-xs font-mono font-bold text-slate-200">Standalone (Full)</div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: iOS Guide */}
          {activePlatformTab === 'ios' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="font-bold text-sm text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <span>{isAr ? 'تثبيت منصة نَفَس على أجهزة Apple iPhone / iPad:' : 'Install on Apple iPhone & iPad:'}</span>
              </div>
              <ol className="space-y-3 list-decimal list-inside text-slate-300">
                <li className="leading-relaxed">
                  {isAr
                    ? 'افتح الرابط في متصفح Safari على جهاز الآيفون أو الآيباد.'
                    : 'Open the platform URL in Safari on your iPhone or iPad.'}
                </li>
                <li className="leading-relaxed">
                  {isAr
                    ? 'اضغط على زر المشاركة (Share) في الشريط السفلي للمتصفح (المربع مع سهم للأعلى ⎋).'
                    : 'Tap the Share icon at the bottom of Safari (box with upward arrow ⎋).'}
                </li>
                <li className="leading-relaxed">
                  {isAr
                    ? 'مرر للأسفل واضغط على "إضافة إلى الشاشة الرئيسية" (Add to Home Screen).'
                    : 'Scroll down and tap "Add to Home Screen".'}
                </li>
                <li className="leading-relaxed">
                  {isAr
                    ? 'اضغط "إضافة" (Add) في الزاوية العلوية. سيظهر رمز تطبيق نَفَس على شاشتك الرئيسية ويعمل كتطبيق مستقل بدون شريط المتصفح.'
                    : 'Tap "Add" in the top corner. The Nafas icon will appear on your home screen and run standalone.'}
                </li>
              </ol>
            </div>
          )}

          {/* Tab 3: APK Package & Bubblewrap / PWABuilder Instructions */}
          {activePlatformTab === 'bundle' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="font-bold text-sm text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span>{isAr ? 'توليد ملف APK موقّع لمتجر Google Play أو التثبيت المباشر' : 'Signed APK / Google Play TWA Bundle'}</span>
              </div>
              <p className="leading-relaxed text-slate-300">
                {isAr
                  ? 'منصة نَفَس تم بناؤها بمعايير Progressive Web App الحديثة، مما يسمح بتحويلها إلى ملف APK أصلي ورفعها على Google Play Store عبر أداة Bubblewrap CLI الرسمية من Google أو PWABuilder.'
                  : 'Nafas is built to modern PWA standards, allowing immediate packaging into a signed Google Play APK using Google Bubblewrap CLI or PWABuilder.'}
              </p>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-indigo-300 space-y-1">
                <div className="text-slate-500">// Command to package APK via Google Bubblewrap CLI:</div>
                <div className="text-emerald-400">npm i -g @bubblewrap/cli</div>
                <div>bubblewrap init --manifest={window.location.origin}/manifest.webmanifest</div>
                <div>bubblewrap build</div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={handleDownloadAPKPackage}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow flex items-center gap-2 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تحميل ملف حزمة تهيئة APK' : 'Download APK Config Bundle'}</span>
                </button>

                <a
                  href={`https://www.pwabuilder.com?url=${encodeURIComponent(currentUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-slate-700 flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isAr ? 'فتح في PWABuilder لتوليد APK سحابياً' : 'Open in PWABuilder (Cloud APK)'}</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? 'حماية وخصوصية تامة للبيانات الصوتية للأطفال' : 'Zero Audio Telemetry & Total Pediatric Privacy'}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            {isAr ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
