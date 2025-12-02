
import React, { useState } from 'react';
import { MediaItem, MediaType, AppProfile } from '../types';
import { Copy, Code, Smartphone, Check, Database, AlertTriangle, Server, FileCode } from 'lucide-react';

interface ApiPreviewProps {
  items: MediaItem[];
  activeApp: AppProfile;
}

const ApiPreview: React.FC<ApiPreviewProps> = ({ items, activeApp }) => {
  const [activeTab, setActiveTab] = useState<'android' | 'php'>('php');
  const [copied, setCopied] = useState(false);
  const isCustomApi = !!localStorage.getItem('custom_api_url');

  const appItems = items.filter(i => i.appId === activeApp.id);

  // PHP API CODE GENERATOR
  const generatePhpCode = () => {
    return `<?php
/*
  api.php - PurrfectAdmin Backend Bridge
  Bu dosyayı sunucunuza yükleyin.
  'media_items' tablosunun MySQL'de olduğundan emin olun.
*/

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header('Content-Type: application/json');

// --- VERİTABANI AYARLARI (DÜZENLEYİN) ---
$host = 'localhost';
$db   = 'veritabani_adi';
$user = 'kullanici_adi';
$pass = 'sifre';
$charset = 'utf8mb4';

// Klasör Ayarı (Resimlerin yükleneceği yer)
$uploadDir = 'uploads/'; 
if (!file_exists($uploadDir)) { mkdir($uploadDir, 0777, true); }

$dsn = "mysql:host=$host;dbname=$db;charset=$charset";
$options = [
    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES   => false,
];

try {
     $pdo = new PDO($dsn, $user, $pass, $options);
} catch (\PDOException $e) {
     echo json_encode(['status' => 'error', 'message' => 'DB Connection Failed']);
     exit;
}

// SQL TABLOSUNU OLUŞTUR (YOKSA)
$sql = "CREATE TABLE IF NOT EXISTS media_items (
    id VARCHAR(255) PRIMARY KEY,
    app_id VARCHAR(255),
    type VARCHAR(50),
    url TEXT,
    title VARCHAR(255),
    description TEXT,
    tags TEXT,
    created_at BIGINT
)";
$pdo->exec($sql);

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET' && $action === 'get_all') {
    $stmt = $pdo->query("SELECT * FROM media_items ORDER BY created_at DESC");
    $items = $stmt->fetchAll();
    
    // Tags sütununu JSON String'den Array'e çevir (Android'in List olarak okuyabilmesi için)
    foreach ($items as &$item) {
        if (!empty($item['tags'])) {
            $decoded = json_decode($item['tags']);
            $item['tags'] = is_array($decoded) ? $decoded : [];
        } else {
            $item['tags'] = [];
        }
    }
    
    echo json_encode(['status' => 'success', 'items' => $items]);
}

elseif ($_SERVER['REQUEST_METHOD'] === 'POST' && $_POST['action'] === 'save') {
    $id = $_POST['id'];
    $fileUrl = $_POST['existing_url'] ?? '';

    // Dosya Yükleme İşlemi
    if (isset($_FILES['file'])) {
        $fileName = basename($_FILES['file']['name']);
        $targetPath = $uploadDir . $fileName;
        if (move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
            // Tam URL oluştur (Sunucu ayarınıza göre değişebilir)
            $protocol = isset($_SERVER['HTTPS']) ? 'https://' : 'http://';
            $fileUrl = $protocol . $_SERVER['HTTP_HOST'] . dirname($_SERVER['PHP_SELF']) . '/' . $targetPath;
        } else {
            echo json_encode(['status' => 'error', 'message' => 'File upload failed']);
            exit;
        }
    }

    $sql = "INSERT INTO media_items (id, app_id, type, url, title, description, tags, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE 
            url=VALUES(url), title=VALUES(title), description=VALUES(description), tags=VALUES(tags)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $id, 
        $_POST['app_id'], 
        $_POST['type'], 
        $fileUrl, 
        $_POST['title'], 
        $_POST['description'], 
        $_POST['tags'], // JSON string olarak gelir (örn: "[\"tag1\", \"tag2\"]")
        $_POST['created_at']
    ]);

    echo json_encode(['status' => 'success', 'url' => $fileUrl]);
}

elseif ($_GET['action'] === 'delete' && isset($_GET['id'])) {
    $stmt = $pdo->prepare("DELETE FROM media_items WHERE id = ?");
    $stmt->execute([$_GET['id']]);
    echo json_encode(['status' => 'success']);
}
?>`;
  };

  const generateAndroidCode = () => {
    const apiUrl = localStorage.getItem('custom_api_url') || 'https://site.com/api.php';
    
    return `
/* 
   ---------------------------------------------------------
   ANDROID - RETROFIT IMPLEMENTATION
   ---------------------------------------------------------
   
   1. build.gradle (Module: app) dosyasına ekleyin:
   implementation 'com.squareup.retrofit2:retrofit:2.9.0'
   implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
   
   2. AndroidManifest.xml dosyasına ekleyin:
   <uses-permission android:name="android.permission.INTERNET" />
*/

import com.google.gson.annotations.SerializedName
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import retrofit2.http.GET

// 1. Data Model
data class WallpaperResponse(
    val status: String,
    val items: List<WallpaperItem>
)

data class WallpaperItem(
    val id: String,
    @SerializedName("app_id") val appId: String,
    val type: String,
    val url: String,
    val title: String,
    val description: String,
    val tags: List<String> // Artık otomatik olarak Liste formatında gelecek
)

// 2. API Interface
interface WallpaperApi {
    @GET("api.php?action=get_all")
    suspend fun getAllWallpapers(): WallpaperResponse
}

// 3. Kullanım (Repository veya ViewModel içinde)
// Base URL, api.php dosyasının bulunduğu klasör olmalıdır.
val retrofit = Retrofit.Builder()
    .baseUrl("${apiUrl.replace('api.php', '')}") 
    .addConverterFactory(GsonConverterFactory.create())
    .build()

val api = retrofit.create(WallpaperApi::class.java)

// Fonksiyon örneği
suspend fun fetchWallpapers() {
    try {
        const response = api.getAllWallpapers()
        if (response.status == "success") {
            const list = response.items
            // RecyclerView adapter'a gönder...
        }
    } catch (e: Exception) {
        e.printStackTrace()
    }
}
`;
  };

  const content = activeTab === 'php' ? generatePhpCode() : generateAndroidCode();

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 h-[calc(100vh-10rem)] flex flex-col">
        
        <div className={`p-6 rounded-2xl border shadow-lg shrink-0 ${isCustomApi ? 'bg-slate-800 border-blue-500/30' : 'bg-amber-900/20 border-amber-500/50'}`}>
            <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${isCustomApi ? 'bg-blue-500/20 text-blue-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {isCustomApi ? <Server className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white mb-1">
                        {isCustomApi ? "Sunucu Bağlantısı Aktif" : "Sunucu Yapılandırılmadı"}
                    </h2>
                    <p className="text-sm text-slate-300">
                        {isCustomApi 
                            ? "Sistem kendi sunucunuzdaki 'api.php' dosyasına bağlı çalışıyor." 
                            : "Verileri sunucunuzda tutmak için 'api.php' dosyasını oluşturup Settings kısmına adresini giriniz."}
                    </p>
                </div>
            </div>
        </div>

        <div className="flex-1 bg-slate-900 rounded-xl border border-slate-700 overflow-hidden shadow-2xl flex flex-col min-h-0">
            <div className="flex justify-between items-center p-2 bg-slate-950 border-b border-slate-800 shrink-0">
                <div className="flex gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button onClick={() => setActiveTab('php')} className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'php' ? 'bg-purple-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                        <FileCode className="w-4 h-4" /> api.php (Backend)
                    </button>
                    <button onClick={() => setActiveTab('android')} className={`px-4 py-1.5 rounded-md text-sm font-medium flex items-center gap-2 transition-all ${activeTab === 'android' ? 'bg-green-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                        <Smartphone className="w-4 h-4" /> Android (Kotlin)
                    </button>
                </div>

                <button onClick={handleCopy} className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-all">
                    {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />} {copied ? 'Kopyalandı' : 'Kodu Kopyala'}
                </button>
            </div>

            <div className="flex-1 overflow-auto relative custom-scrollbar bg-[#0d1117]">
                <pre className="p-6 text-sm font-mono leading-relaxed">
                    <code className={activeTab === 'php' ? "text-purple-300" : "text-green-300"}>
                        {content}
                    </code>
                </pre>
            </div>
        </div>
    </div>
  );
};

export default ApiPreview;
