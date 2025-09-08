export default function Footer() {
  return (
    <footer className="mt-16 border-t border-black/10 bg-[#F7F8FA]">
      <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-muted">
        <p className="mb-2">
          免責聲明：本網站資訊僅供參考，零售價格屬估算，實際價格依地區與店家為準；
          資料可能延遲或有錯誤，本站不負任何法律或財務責任。
        </p>
        <p className="mb-2">
          資料來源：
          <a
            href="https://amis.afa.gov.tw"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline text-ink"
          >
            農業部 AMIS Open Data
          </a>
        </p>
        <p className="mt-2">
          © 2025 菜價看板 | VeggieBoard ・ 由{' '}
          <a
            href="https://www.linkedin.com/in/guocianyu/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline text-ink inline-flex items-center gap-1"
            aria-label="前往作者的 LinkedIn（Cian-Yu, Guo）"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Cian-Yu, Guo
          </a>
          {' '}製作．All rights reserved.
        </p>
      </div>
    </footer>
  );
}