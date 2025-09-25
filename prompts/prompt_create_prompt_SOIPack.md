Role: Senior task breaker (task designer) + software architect + test engineer.
Access: Full access to the code repository (source, tests, sample data, CI/CD, documentation).
Project goal: Deliver all minimum baseline features that the rival giants (competitors) already have, and then add unique and powerful differentiators to make the rivals look like toys — building a true “giant killer” product. Project description: “Proje 3: DO‑178C “SOI Veri Paketi Otomasyonu” (Plan‑İzlenebilirlik‑Kapsama Derleyici) (SOIPack)
Alan	İçerik
Özet (1 paragraf)	Hava aracı yazılım projelerinin DO‑178C kapsamındaki denetimlerinde (sertifikasyon makamı incelemeleri) istenen planlar, izlenebilirlik ve doğrulama kanıtlarını tek bir otomatik “SOI Data Pack” halinde toplayan yazılım. Farklı kaynaklardan (ALM, gereksinim araçları, test/coverage çıktıları, statik analiz raporları) kanıtları içe aktarır, DO‑178C hedeflerine (Appendix A, Tablo A‑3…A‑7) iz düşüm oluşturur, boşlukları işaretler ve denetlenebilir PDF/HTML raporları üretir. Değer: SOI denetimlerine hazırlık süresini ve yeniden iş maliyetini azaltır; mevcut araç zincirlerine eklenir, değiştirme istemez. Neden şimdi: AC 20‑115D ile DO‑178C yaygın kabul görür; denetim beklentileri ve izlenebilirlik kanıtı gereksinimleri yüksektir. (Federal Aviation Administration)
Mandat/Gate	Gate: Sertifikasyon otoritesi önünde DO‑178C uygunluk gösterimi (SOI denetimleri için planlar/standartlar, izlenebilirlik, doğrulama sonuçları, kapsam kanıtı). Dayanak: FAA AC 20‑115D (DO‑178C’yi kabul edilen yöntem olarak tanır); FAA Order 8110.49A (yazılım onay rehberi, DO‑178C uygulaması ve inceleme beklentileri). Yaptırım Kurumu: FAA/EASA/ulusal otoriteler. (Federal Aviation Administration)
Zorunluluk Skoru (0–5)	5/5 — DO‑178C’ye dayalı uygunluk kanıtı olmadan tip sertifikaya giden yazılım konfigürasyonları onaylanmaz. AC 20‑115D bu yolu açıkça tanımlar. (Federal Aviation Administration)
Bölge/Jurisdiksiyon (ITAR/EAR notu)	TR / NATO / EU / US. Ürün yazılımdır; paket imzalama/şifreleme içerirse EAR Cat.5 Pt.2 (ECCN 5D002) kapsamına girebilir, çoğunlukla License Exception ENC (§740.17) ile ihraç edilebilir (bildirim/sınıflandırma gerekebilir). ITAR değil. (eCFR)
Delil/Artefakt	1) Objective Compliance Matrix (DO‑178C Tablo A‑3…A‑7 hedeflerine karşı doldurulmuş, boşluk listeli) PDF/HTML; 2) İzlenebilirlik Matrisi (Req ⇄ Tasarım ⇄ Kod ⇄ Test, JUnit XML/ReqIF/CSV içe aktarımı) HTML+CSV; 3) Kapsam Özeti (MCDC/statement/branch) PDF/JSON; 4) Plan/Standart seti (PSAC, SDP, SVP, SCMP, SQAP) şablon doldurmalı PDF/Docx; 5) Kanıt Manifesti (SHA‑256 hash’li JSON; opsiyonel PKCS#7/JWS imzası). (DO‑178C hedef/kanıt yapısına dayanır.) (Federal Aviation Administration)
Ürün Taslağı	Modüller: (A) Bağdaştırıcılar (Jama/DOORS‑ReqIF, Polarion/Jira‑CSV‑API, Git, Jenkins, JUnit XML, LCOV/Cobertura, Polyspace/LDRA/VectorCAST rapor içe aktarımı); (B) Hedef Eşleyici (kanıtları DO‑178C hedeflerine ve veri öğelerine map eder); (C) İzlenebilirlik Motoru (öneri tabanlı bağlantılar + kullanıcı onayı); (D) Raporlayıcı (SOI Data Pack üretimi); (E) Kalite Kuralları (eksik/çelişkili kanıt denetimleri); (F) Güvenlik/İmza. Arayüzler: CLI, REST (OpenAPI), hafif Web UI. Veri biçimleri: JSON/CSV/ReqIF/HTML/PDF/ZIP. (Parasoft)
Ekonomi	TTFR: 3 hafta (ücretli PoC + rapor). MVP maliyeti: ~240–280 saat + $1–2k dış maliyet (kod imzalama sert., HSM token). Fiyat modeli: Sunucu/on‑prem yıllık $30k–$45k; SDK/seat/yıl $6k–$9k; PoC/Denetim paketi $10k–$20k. Beklenen ilk yıl geliri: $150k–$300k (3–6 müşteri karması). Kısa ROI: ≈ Gelir / (Zaman+maliyet) → örn. $200k / $15k ≈ 13.3x.
Alıcı Profili	Aviyonik yazılım yöneticisi, Sertifikasyon/uyumluluk lideri, Kalite güvencesi (QA) yöneticisi, Entegratör CTO/Program yöneticisi (SOI hazırlık sorumluları).
Rekabet & Ayrışma	Alternatifler: (1) ALM‑merkezli manuel paketleme (Jama/DOORS/Polarion + Excel + Word; zaman alır, tutarsızlık riski); (2) Araç tedarikçisi ekosistemleri (LDRA/VectorCAST/Parasoft) — güçlü test/kapsam, ancak çok‑kaynaklı kanıtı DO‑178C hedeflerine tek tuş paketleme sınırlı. Fark: “Kanıt topla → Hedefe eşle → SOI paketi üret” otomasyonu; araç‑agnostik ithalat; eksik hedef uyarıları; tamamen on‑prem/offline. (Parasoft)
Risk & Azaltım	Zaman senkronu: Sürüm/konfig. damgası + Git tag ile kanıt dondurma. Anahtar yönetimi: HSM/Yubi, kurumsal PKI, anahtar döndürme SOP. Veri erişimi: Air‑gapped kurulum, yalnız yerel depolama. İhracat/akreditasyon: ENC §740.17 kapsamında sınıflandırma ve gerektiğinde CCATS/raporlama; riskli ülke jeo‑kısıtları. Araç nitelendirme (DO‑330): Ürünü “destekleyici” (credit vermeyen) modda konumlandırıp TQL etkisini minimize etmek; istenirse Tool Assessment/TQP iskeleti üretimi. (LDRA)
İcra Planı	0–14 gün (kanıt değeri en yüksek demo): CLI ile Jira‑CSV + ReqIF + JUnit XML + LCOV içe aktar → Objective Compliance Matrix v0 + İzlenebilirlik matrisi + tek tık SOI Pack (ZIP). Örnek veri seti ile demo.
	15–45 gün (Pilot): REST+Web UI; Git/Jenkins bağlayıcıları; boşluk/uyumsuzluk kuralları; Tool Assessment (DO‑330) rapor iskeleti; 1–2 müşteri verisiyle pilot. (LDRA)
	46–90 gün (Ürünleşme): Kurumsal kurulum, kullanıcı/rol modeli, şablon yönetimi (PSAC/SDP/SVP/SCMP/SQAP), ek bağdaştırıcılar (Polarion/DOORS API), bakım SLA ve ilk satışlar.”

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
