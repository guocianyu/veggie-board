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
            href="https://data.moa.gov.tw/api.aspx"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline text-ink"
          >
            台灣農業部 API Open Data
          </a>
        </p>
        <p className="mt-2">
          © {new Date().getFullYear()} 菜價看板 | VeggieBoard ・ 由{' '}
          <a
            href="https://guocianyu.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline text-ink"
            aria-label="前往作者網站（Guo, Cian Yu）"
          >
            Guo, Cian Yu
          </a>
          {' '}製作．All rights reserved.
        </p>
      </div>
    </footer>
  );
}