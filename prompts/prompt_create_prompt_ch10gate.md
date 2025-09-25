Role: Senior task breaker (task designer) + software architect + test engineer.
Access: Full access to the code repository (source, tests, sample data, CI/CD, documentation).
Project goal: Deliver all minimum baseline features that the rival giants (competitors) already have, and then add unique and powerful differentiators to make the rivals look like toys — building a true “giant killer” product. Project description: “Proje 2: IRIG-106/TMATS Test Veri Kabul Doğrulayıcı (Oto-Onarımlı) (ch10gate) 
Alan	İçerik
Özet (1 paragraf)	Uçuş testi/yer telemetrisi ekiplerinin IRIG‑106 Chapter 10 kayıtları ve TMATS (Ch.9) dosyalarını teslim etmeden önce otomatik doğrulayan, yaygın tutarsızlıkları onaran (TMATS–kanal çapraz eşleşmeleri, zaman damgası tutarlılığı, paket tipleri, sözlük/ICD eşleşmeleri) ve kabul raporu üreten bir yazılım kiti (CLI/REST/UI/SDK). Değer: “range / kabul” kapısında geri çevrilme riskini ve yeniden test maliyetini azaltır; ilk günden mevcut COTS kaydedicilerden çıkan dosyalarla çalışır. Neden şimdi: IRIG‑106 Ch.10’un sektör hakimiyeti ve TMATS’in test menzili kurulumunun dayanak verisi olması; ayrıca programların ATP/uygunluk testleri ile kabul baskısının artması. (NASA Technical Reports Server)
Mandat/Gate	Gate: Uçuş testi veri paketinin IRIG‑106 Ch.10 formatında ve TMATS (Ch.9) ile uyumlu olarak kabul/ingest edilmesi (menzil/kurum talebi, sözleşme eki). Dayanak: IRIG‑106 Ch.9 TMATS, menzilde alma/işleme kurulumuna gerekli öznitelik aktarımını tanımlar; Ch.10 kayıt/packet yapılarıyla TMATS’in birlikte kullanımını programcı el kitabı açıklar; IRIG‑106 uyumluluğuna yönelik Acceptance Test Procedure (ATP) örnekleri literatürde mevcuttur (kabul kapsamı, doğruluk, veri tipleri). Yaptırım kurumu: RCC/Telemetry Group; menzil işletmeleri (US/EU/NATO). (IRIG 106)
Zorunluluk Skoru (0–5)	5/5 — IRIG‑106/TMATS uyumu olmadan pek çok menzil/veri merkezi kabul etmez; ATP/prosedürler IRIG‑106 uyumluluğunu şart koşar. (repository.arizona.edu)
Bölge/Jurisdiksiyon (ITAR/EAR notu)	TR / NATO / EU / US. Ürün yazılımdır; paket bütünlük imzası/kripto kullanırsa tipik olarak EAR Cat.5 Pt.2 (ECCN 5D002) kapsamındadır ve çoğu durumda License Exception ENC (15 CFR §740.17) ile ihraç edilebilir (müşteri/ülke kontrolü ve raporlama gerekebilir). ITAR değil; yine de sınıflandırma/CCATS tavsiye edilir. (eCFR)
Delil/Artefakt	1) Kabul Matrisi Raporu (PDF): Ch.10/Ch.9 maddelerine satır referanslarıyla pass/fail; 2) JSON/CSV teşhis logları: paket türü, kanal, zaman damgası, TMATS–Ch.10 çapraz kontrolleri; 3) Manifest (JSON + SHA‑256): teslim edilen .ch10/.tmats dosyalarının hash’leri, tarih/sürüm; opsiyonel PKCS#7/JWS imza; 4) Revizyon izleri (hangi alanların otomatik düzeltildiği). (TMATS’in menzil kurulumunda zorunlu bilgi taşıdığı ve Ch.10 ile ilişkisi kaynaklı). (IRIG 106)
Ürün Taslağı	Modüller: (A) Ingest: .ch10/.tmats + dizin tarayıcı; (B) Parser: Ch.10 paket başlıkları/zaman formatları; (C) Validator: TMATS↔kanal envanteri, veri türü (1553/ARINC429/PCM/Analog/Ethernet vs.), zaman ve paket bütünlüğü, sürüm/profil kuralları; (D) Auto‑Fix: TMATS anahtar/alan normalizasyonu, eksik zorunlu alanların türetimi (metaveri/ICD yardımıyla), ufak timestamp/epoch tutarlılık düzeltmeleri; (E) Raporlayıcı: PDF/JSON; (F) Manifest/İmza; (G) API/UI: CLI, REST (OpenAPI), hafif web UI. Veri biçimleri: JSON Lines, CSV, PDF, ZIP (rapor+manifest+log). Entegrasyonlar: Kayıt cihazı üretici çıktıları (Ç10 standart), 1553/ARINC429 paket tipleri için kural setleri. (IRIG 106)
Ekonomi	TTFR: 3–4 hafta (ücretli rapor hizmeti + erken lisans). MVP maliyeti: ~240–280 saat + $1–2k dış maliyet (kod imzalama sert., HSM token). Fiyat modeli: 1) Sunucu/on‑prem yıllık: $25k–$35k; 2) SDK/seat/yıl: $9k–$12k; 3) PoC/Kabul raporu hizmeti: $2k–$6k/paket. Beklenen ilk yıl geliri: $120k–$250k (3–6 müşteri karması). Kısa ROI: ≈ Gelir / (Zaman+maliyet) → örn. $180k / $15k ≈ 12x.
Alıcı Profili	Flight Test Instrumentation (FTI) lideri, Telemetri/Range operasyon yöneticisi, Aviyonik entegrasyon yöneticisi, Kalite/uyumluluk lideri (kabul raporundan sorumlu).
Rekabet & Ayrışma	Alternatifler: (1) Kendi araç zinciri + IRIG dokümanları (yüksek efor, standarda iz düşümlü rapor yok); (2) Vendor özgü araçlar (kayıt/oynatma/izleme güçlü, fakat TMATS↔Ch.10 tutarlılık için otomatik onarım ve denetlenebilir kabul matrisi sınırlı). Fark: “Validate → Auto‑Fix → İmzalı Kabul Paketi” uçtan uca akış; kural paketi ile sürüm/profil seçimi; tamamen offline/on‑prem; COTS’la uyum. (Ch.10’un 1553/ARINC/PCM vb. çoklu veri tiplerini kapsaması sayesinde tek araçla çok kanal.) (IRIG 106)
Risk & Azaltım	Zaman/sürüm senkronu: Ch.10/Ch.11 ayrımı ve sürümler için kural paketleri; sürüm‑tünelleme testi. Anahtar yönetimi: HSM/Yubi, kurumsal PKI, offline imza; anahtar döndürme prosedürü. Veri erişimi: Air‑gap mod; yalnız yerel dosya. İhracat/akreditasyon: ENC kapsamı için self‑classification/CCATS ve ülke/son kullanıcı taraması; raporda madde referanslı izlenebilirlik. (eCFR)
İcra Planı	0–14 gün: CLI prototip — .ch10 + .tmats → JSON teşhis + kısa PDF “Kabul Matrisi” (Ch.9/Ch.10 paragraf referanslı); 1–2 tip veri (ör. 1553 + ARINC429) için kurallar; örnek uçuş seti üzerinde demo. (IRIG 106)
	15–45 gün: Pilot PoC — Auto‑Fix v1 (TMATS alan normalizasyonu, kanal eşlemesi), REST API + basit web UI, Manifest/Hash; iki farklı menzil/entegratör datası ile kabul denemesi; ATP checklist’e iz düşüm. (repository.arizona.edu)
	46–90 gün: Ürünleşme — lisanslama/kurulum paketleri, genişletilmiş rapor şablonları, sürüm profilleri (106‑09/11/15/20), müşteri başına kural setleri, bakım SLA; ilk kurumsal sözleşmeler. (trmc.osd.mil)
Kaynaklar (tarihli)	RCC 123‑20, “IRIG‑106 Chapter 10 Programmers’ Handbook” (Ağustos 2020): Ch.10 veri paketleri, TMATS’in Ch.10 içindeki konumu ve sürüm alanları – geliştirici odaklı el kitabı. (trmc.osd.mil)
	IRIG‑106 Chapter 9 TMATS (2015 baskısı): TMATS’in menzilde alma/işleme kurulumuna gerekli öznitelik aktarımını tanımlaması; veri alışının dayanak şeması. (IRIG 106)
	ITC Paper, “Acceptance Testing Procedure (ATP) – Compliance Testing of IRIG‑106 Chapter 10” (2005): Kayıt cihazları/veri setleri için IRIG‑106 uyumluluğu odaklı kabul test adımları ve ölçütleri. (repository.arizona.edu)”

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
