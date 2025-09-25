# Codex Görev Orkestratörü

Playwright tabanlı bu Node.js/TypeScript projesi, Codex UI üzerinden çok depo için görev otomasyonu yapar. Proje, verilen nihai tasarım dökümanına uygun olarak yapılandırılmıştır.

## Özellikler

- **Tek kaynaklı görev yönetimi:** `tasks/todo.md` dosyasını okuyup tamamlanan görevleri işaretler.
- **Batch çalışması:** Varsayılan olarak iki görevlik paketleri Codex UI üzerinden yürütür, başarısız olanları tek tek yeniden dener.
- **PR otomasyonu:** Her üç başarılı görevden sonra Codex UI içinde `create pr` akışını tetikler.
- **Yeni liste üretimi:** Bir depo görevleri tamamlandığında `prompts/new_list_prompt.txt` şablonunu kullanarak Codex'ten yeni görev listesi ister.
- **Durum yönetimi:** `state/state.json` dosyası, son depo, PR bilgisi ve sayaçları saklar; `state/state.lock` dosyasıyla kilitlenir.
- **Opsiyonel QA kontrolleri:** İstenirse hedef depo içinde build/test/lint komutlarını koşturur.

## Kurulum

```bash
pnpm install
npx playwright install --with-deps
cp .env.example .env
```

`.env` dosyasını ihtiyaçlarınıza göre doldurun. Cookie tabanlı giriş önerilir; aksi halde `CODEX_UI_EMAIL` ve `CODEX_UI_PASSWORD` değişkenlerini tanımlayın.

## Çalıştırma

```bash
pnpm start
```

Komut, kilit mekanizmasıyla tek instance çalıştırır. `PAUSE=true` ayarıyla orkestratörü geçici olarak duraklatabilirsiniz.

## GitHub Actions

`.github/workflows/orchestrate.yml` iş akışı 30 dakikada bir çalışacak şekilde ayarlanmıştır. Secret ayarlarında Playwright cookie JSON'unu `CODEX_COOKIES` olarak saklayıp çalışma sırasında `cookies.json` dosyasına yazdırın.

## Yapı

```
.
├─ src/
│  ├─ config.ts            # .env okuma & doğrulama
│  ├─ index.ts             # ana orkestrasyon akışı
│  ├─ codex/               # Codex sürücüleri (UI + API şablonu)
│  ├─ io/                  # görev ve state dosya yardımcıları
│  ├─ qa/                  # opsiyonel QA kapıları
│  └─ util/                # logger ve kilit yardımları
├─ tasks/todo.md           # görev listesi
├─ prompts/                # prompt şablonları
├─ state/                  # state.json (run sırasında oluşur)
└─ .github/workflows/      # otomasyon job'u
```

## Notlar

- `CODEX_DRIVER=ui` varsayılan sürücü. API desteği için `src/codex/client-api.ts` şablonu hazır.
- QA kontrolleri için `QA_ENABLED=true` yapıp ilgili komutları `.env` üzerinden set edin.
- Log seviyesi `LOG_LEVEL=debug` vb. ayarlanabilir.

