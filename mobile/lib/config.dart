/// API server. Override at build time: --dart-define=API_BASE=https://...
const apiBase = String.fromEnvironment('API_BASE', defaultValue: 'https://newlook.morosmartcitys.com');

/// Absolute URL for API-relative paths such as "/uploads/..." or "/assets/...".
String resolveUrl(String path) => path.startsWith('/') ? '$apiBase$path' : path;
