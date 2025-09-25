Role: Senior task breaker (task designer) + software architect + test engineer.
Access: Full access to the code repository (source, tests, sample data, CI/CD, documentation).
Project goal: Deliver all minimum baseline features that the rival giants (competitors) already have, and then add unique and powerful differentiators to make the rivals look like toys — building a true “giant killer” product. Project description: “Proje 1: FMV Uyum ve Köken Doğrulama Paketi (VideoKit)
(STANAG 4609 / MISB ST 0601 doğrulayıcı & otomatik düzeltici + C2PA/JUMBF imzacı)
Alan	İçerik
Özet (1 paragraf)	ISR/FM V (Full Motion Video) akışlarında STANAG 4609 + MISB ST 0601 KLV metadatasını otomatik doğrulayan, tipik hataları onaran (ölçek/UL/alan tutarsızlıkları), MISB ST 0902 minimum set kapsaması üreten ve çıktıyı C2PA/JUMBF manifestiyle kripto‑imzalı olarak paketleyen yazılım araç takımı (CLI/SDK/REST/UI). Çıktılar: “uyum matrisi” PDF/JSON, kare‑bazlı teşhis logları, imzalı MP4/TS+manifest. Değer: GCS/yer istasyonu/ISR entegratörleri ile QA/uyumluluk ekipleri için kabul reddini ve yeniden test maliyetini düşürür; C2PA ile içerik kökeni/provenansı belgeler. NATO/MISB FMV birlikte çalışabilirliği ve sektörde hızla benimsenen içerik doğrulaması nedeniyle tam zamanı. (GeoIntel Standards Group)
Mandat / Gate	Gate: FMV akışlarının kabul/ingest aşamasında STANAG 4609 Ed.3 ile MISB ST 0601’in zorunlu alt kümesine uyum + MISB ST 0902 tavsiye edilen minimum KLV seti. Birçok COTS/PED sistemi (örn. Esri FMV) MISB 0601 alanlarını bekler; eksik/uygunsuz akışlar reddedilir. C2PA/JUMBF manifesti ise içerik kökeni için kripto‑doğrulanabilir kanıt sağlar (MP4 içinde UUID kutusunda gömülü). Yaptırım/otorite: NATO NSO/MISB (NGA) — FMV interoperabilitesi; kurum içi kabul kriterleri; ABD tarafında CUI içeren iş akışlarında kripto için NIST SP 800‑171/CMMC beklentileri. (iosb.fraunhofer.de)
Zorunluluk Skoru (0–5)	5/5 — FMV kabulü doğrudan standarda bağlı; uyumsuz akışlar operasyonel sistemlere alınmaz. (iosb.fraunhofer.de)
Bölge / Jurisdiksiyon	TR / NATO / EU / US. İhracat notu: Ürün genel amaçlı yazılımdır; kripto kullandığı için EAR Cat.5 Pt.2 (ECCN 5D002) kapsamına girebilir; çoğu senaryoda License Exception ENC (15 CFR §740.17) uygulanabilir. Savunma amaçlı “specially designed” bir modül haline getirilmediği sürece tipik olarak ITAR değil; sınıflandırma/CCATS değerlendirmesi önerilir. (Bureau of Industry and Security)
Delil / Artefakt	1) Uyum Matrisi Raporu (PDF): STANAG 4609 Ed.x / MISB ST 0601.x alan doğrulama, ST 0902 minimum set kapsama yüzdesi; 2) JSON/CSV teşhis: kare‑bazlı KLV doğrulama/fix logları; 3) C2PA/JUMBF manifest (MP4 içine gömülü veya TS için sidecar) + X.509 imza zinciri; 4) Opsiyonel: FIPS modunda kripto kullanıldığına dair sistem kanıtı. (Haivision InfoCenter)
Ürün Taslağı	Modüller: (A) Ingest: dosya (MP4/TS) ve ağ (RTP/UDP/SRT); (B) KLV Decoder: jMISB/klvdata tabanlı; (C) Validator: ST 0601 anahtar aralıkları, ST 0902 minimum set, ST 0102 güvenlik LS, TS/KLV senkronizasyon kontrolleri; (D) Auto‑Fix: ul/ölçek/alan normalizasyonu, eksik zorunlu alanlar için harici kaynak eşlemesi (varsa); (E) Provenans: C2PA manifest üretimi (JUMBF), MP4 UUID kutusuna gömme/TS sidecar; (F) Raporlayıcı: PDF/JSON; (G) API/UI: CLI, REST (OpenAPI), hafif web UI; (H) Entegrasyonlar: FFmpeg/GStreamer filtreleri, Esri FMV/jMISB ekosistemi ile uyumlu dışa‑aktarım. Veri biçimleri: JSON Lines, CSV, PDF, MP4(+JUMBF), .c2pa.json sidecar. (GitHub)
Ekonomi (net & rakamlı)	TTFR (ilk gelir): 3–4 hafta (PoC/rapor hizmeti + erken lisans). MVP maliyeti: ~270 saat (çekirdek doğrulayıcı+rapor+CLI/REST+basit C2PA) + ~$1.5k dış maliyet (kod imzalama sert., HSM token, test altyapısı). Fiyat modeli: 1) SDK/Seat/yıl: $12k; 2) Küçük sunucu (on‑prem) yıllık: $30k; 3) PoC/rapor hizmeti (tek akış): $2k–$5k. Beklenen ilk yıl geliri: $120k–$300k (3–6 müşteri, karışık lisans+PoC). ROI kısa formülü: ≈ Gelir / (Toplam maliyet); örn. $180k / $15k ≈ 12x.
Alıcı Profili	GCS/yer sistemi ürün sahibi, ISR entegrasyon lideri, FMV uyumluluk/QA sorumlusu, sensör/payload entegratörü, hava/deniz platform yer istasyonu ekipleri.
Rekabet & Ayrışma	Alternatifler: (1) jMISB + kendi scriptleri (açık kaynak kütüphane, standart rapor/auto‑fix yok); (2) KLV Inspector / vendor araçları (genelde analiz/izleme odaklı, C2PA ve otomatik rapor/uyum matrisi zayıf); (3) Fraunhofer/özel validatorler (simülasyon/val. var, fakat “fix+provenans+REST” birleşimi nadir). Farkımız: “Validate → Auto‑Fix → C2PA İmzala → Uyum Raporu” uçtan uca; REST otomasyonu, MP4 içine JUMBF; MISB ST 0902 coverage yüzdesi; düşük kurulum maliyeti. (impleotv.com)
Risk & Azaltım	Zaman/versiyon farkları: MISB/4609 sürüm profillerini “kural paketi” olarak ayır; müşteri profiline göre seç. Anahtar yönetimi: HSM/Yubi‑tabanlı, offline imzalama; X.509 kurumsal PKI; döndürme prosedürü. Veri erişimi: Tamamen on‑prem/offline mod; hiçbir medya dışa çıkmaz. İhracat: Ürünü ENC muafiyeti altında sınıflandır; yüksek riskli ülkelere jeo‑kısıt; müşteriyle ECCN teyidi/CCATS. Akreditasyon/kabul: Rapor şablonları ST 0902/0601 maddelerine satır‑satır referans verir; müşterinin kabul listesiyle birlikte “kapsam matrisi” üret; gerekiyorsa müşterinin test vektörleriyle kalibrasyon. (Legal Information Institute)
İcra Planı (yalın)	0–14 gün: CLI doğrulayıcı (MP4/TS → JSON teşhis + PDF Uyum Matrisi); en az 1 örnek akış için ST 0902 minimum set kapsama raporu; MP4 içine C2PA/JUMBF gömme demo. Kanıt: tek tık PDF + örnek imzalı dosya. (Haivision InfoCenter)
	15–45 gün: Pilot PoC (1–2 müşteri); GStreamer/FFmpeg filtresi; “auto‑fix” ilk dalga (ölçek/UL/dönüşüm); REST API + basit UI; Esri FMV’ye uygun dışa‑aktarım testi. (Esri Support)
	46–90 gün: Ürünleştirme (lisanslama, paketleme), FIPS‑mod kripto konfig. seçeneği, ilk kurumsal satışlar, bakım SLA. (NIST Computer Security Resource Center)
Kaynaklar (tarihli)	NGA/MISB (resmi): MISB’nin kapsamı ve uyumluluk/değerlendirme odağı; FMV ekosisteminde standartlaştırma rolü. (erişim 2025) (GeoIntel Standards Group)
	Haivision dok. (uygulama): MISB ST 0902 için önerilen minimum metadata seti — pratik kabul/ingest beklentisini gösterir. (v1.8, 2024–2025) (Haivision InfoCenter)
	Fraunhofer IOSB: STANAG 4609 Ed.3’ün MISB ST 0601 zorunlu alt kümesi odağını açıklar (simülatör/validator). (erişim 2025) (iosb.fraunhofer.de)
	C2PA 2.2 Teknik Şartname: JUMBF tabanlı Manifest Store ve imza/iddia/kanıt yapısı. (2024–2025) (C2PA)
	AWS MediaConvert dok.: C2PA manifestin MP4 içinde UUID box olarak gömülmesi (yerleşim). (erişim 2025) (AWS Documentation)
	NIST SP 800‑171 (Rev.3): CUI koruması ve FIPS‑doğrulanmış kripto beklentisine dayanak. (2024) (NIST Computer Security Resource Center)”

Task:
1. Analyze the repository and the project description. First internalize the industry-accepted baseline features. Compare with the repo.
2. Identify the gaps. Create tasks to close them.
3. Identify unique differentiators needed to surpass the giants. Write them as separate tasks as well.
4. Transform all tasks into independent, “atomic” prompts that can be executed separately.

Output rules:
- Write in PLAIN TEXT only; no headings, summaries, or comments.
- Output only a numbered list.
- 1 is the most critical, with decreasing importance as numbers increase.
- Write a maximum of 12 tasks; continue in the next batch if needed.
- Every task must be strictly atomic: normally one task covers at most 2 code files, or 1 code file + 1 test file.
- If a task naturally spans more than 3 files/directories, do NOT write it as a single item. Automatically split it into sub-tasks and list them separately. Sub-tasks should complement each other but each must stand on its own.
- Each task must focus on a single subsystem/directory. Do not mix multiple areas.
- If you must make assumptions, clearly mark them with “ASSUMPTION:”.
- Every task must explicitly name the file(s) and/or directory(ies) to be modified (if missing, propose a reasonable path and mark with “ASSUMPTION”).
- Write technical steps short, clear, and concrete.
- Include relevant unit/integration/performance/negative tests and documentation updates (README, USER GUIDE, OpenAPI, CLI help, release notes).
- Mention migration/packaging steps if needed.
- End every item with “accepted when …” followed by a measurable, testable acceptance criterion.
- Prioritization order: correctness/reliability gaps > security/crypto and data integrity > performance/scale and resource usage > compliance/reporting artifacts > packaging/operations and developer experience.
- Do not ask questions; state reasonable assumptions explicitly.
- Task format must strictly follow this example:

“8. internal/rules/builtin.go + internal/rules/builtin_a429_test.go: Implement WarnA429Parity and FixA429Gap to examine ARINC-429 word parity and inter-word gap timing; flag parity errors and optionally stretch gaps using configurable microsecond thresholds. Tests should simulate parity flips and gap violations. Update internal/rules/README.md with ARINC handling. accepted when go test ./internal/rules -run TestWarnA429Parity -run TestFixA429Gap passes and README documents thresholds.
9. internal/tmats/parser.go + internal/tmats/parser_test.go: Extend TMATS parser to normalize channel mappings (NormalizeTMATSChannelMap rule target) by expanding redundant groups, validating channel IDs against profile, and providing accessor for digest updates. Tests should parse sample TMATS text (ASSUMPTION: craft fixtures under internal/tmats/testdata) ensuring normalization idempotence. Document normalization flow in internal/tmats/README.md. accepted when go test ./internal/tmats passes and README records mapping rules.
10. internal/report/pdf.go + internal/report/pdf_test.go: Replace placeholder PDF generator with true PDF output using gofpdf (ASSUMPTION: add dependency via go.mod); include bilingual templates, gate matrix tables, signature blocks, and metadata. Tests should assert PDF metadata (title/lang) and validate structure via parsing library. Update internal/report/README.md to describe PDF layout. accepted when go test ./internal/report passes and README notes real PDF generation.”

Every task must follow this same structure: <number>. <file1> + <file2>[ + <README.md>]: <single imperative sentence>; <test description>. accepted when <single-line test/doc criterion>.
