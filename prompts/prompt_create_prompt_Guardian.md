Repository’yi incele, mevcut kod ve testleri tara, TODO/FIXME/notları ve eksik uçları topla. Amaç: offline, akıllı ses+görüntü koruma, tehdit öngörüsü, 3D pose estimation ile hareket takibi ve gelecek hareket tahmini, yüz kaydı ve farklı yüz ayırt etme, insan dışı nesneleri ayırt etme (kedi, köpek, tehdit unsuru olabilecek bir nesne) (Node.js + TypeScript, better-sqlite3, onnxruntime-node, meyda, fluent-ffmpeg/ffmpeg-static, vitest). Bulduklarına dayanarak “sıradaki adımlar”ı sadece düz metin olarak, aşağıdaki FORMATTA yaz. Her madde tek satır olmalı, numara ile başlasın, bir veya daha çok “dosya yolu” listesi, ardından yapılacak işin özeti, test kapsamı ve “accepted when” kriteri gelsin. Yeni dosyalar gerekiyorsa açıkça listele. Varsayılan test komutu pnpm vitest run -t "TestName" olsun. Markdown kullanma, giriş/çıkış cümlesi yazma; SADECE maddeleri yaz.
FORMAT ÖRNEĞİ (birebir uygula):
1. path1 + path2 + path3: Yapılacak iş özeti; testlerin neyi doğruladığı; accepted when <komutlar ve ölçütler>.
Yönergeler:
* Önce güvenilirlik/sağlamlık (hata yakalama, kaynak sızıntıları, platform farklılıkları), sonra doğruluk (model çıktılarını doğru ayrıştırma), sonra özelliğe yönelik genişleme (RTSP/çoklu kamera, web arayüzü), ardından işletim (veri saklama, CLI, Docker/systemd), en sonda dokümantasyon.
* Mevcut dosya/klasör ve isimlendirmeleri kullan; uydurma isimlerden kaçın. Gerçek kodda gördüğün API’lere (EventBus, config, db, logger, VideoSource, AudioSource vb.) referans ver.
* Donanım bağımlı testler için mock/stub kullan; meyda/onnx/ffmpeg çağrılarını izole eden birim testleri öner.
* Her maddenin “accepted when” bölümünde en az bir test adı ver ve somut bir çalışma ölçütü tanımla (ör. pnpm vitest run -t MotionBackoff, pnpm tsx … çalışınca belirli bir çıktı/ dosya/DB kaydı oluşur).
* Offline kal (bulut servisi yok), mevcut bağımlılıklardan şaşma; gerekirse küçük yardımcı bağımlılıkları açıkça ekle.
* Çapraz platform notlarını (Windows/ALSA/ CoreAudio/Video4Linux) ve hatalı durumları (ffmpeg yok, RTSP down, ORT model yüklenemedi) ele alan işler ekle.
* Her test ismi benzersiz ve anlamlı olsun.
Şimdi repository’yi incele ve 10–14 arası madde üret; aşağıdaki konuları mutlaka kapsa ama depodaki gerçeğe göre uyarlayarak yaz:
* ffmpeg boru hattında hata/yeniden dene/süre aşımı yönetimi ve kaynak kapanışı
* Video motion/light dedektörlerinde gürültü azaltma ve debounce/backoff
* Yolo çıktı ayrıştırma (NMS, bbox ölçekleme, class id=person) ve güven puanı hesaplaması
* RTSP/çoklu kamera desteği, her kamera için kanal kimliği ve bağımsız eşikler
* AudioSource için ffmpeg fallback ve cihaz keşfi; RMS/centroid için pencereleme
* Olay bastırma (suppress) pencereleri ve oran sınırlama (rate limit)
* Veri saklama politikası, arşiv ve snapshot rotasyonu; SQLite indeksleri ve VACUUM bakımı
* Yerel REST API (olay listele, snapshot sunum) + basit HTML arayüz
* Yapılandırma doğrulama ve canlı yeniden yükleme (hot reload)
* CLI/daemon başlatıcı, healthcheck ve kapanış kancaları; Dockerfile ve systemd unit
* Tanılama ve ölçümler (pino seviyeleri, metrik sayaçları)
* README’de kurulum/kullanım/ sorun giderme bölümleri
Sadece maddeleri yaz; başka hiçbir şey yazma.
