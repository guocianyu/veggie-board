'use client'
import { useState } from 'react'
import { usePriceMode } from '@/lib/price-mode'

function cn(...a:any[]){ return a.filter(Boolean).join(' ') }

export default function FloatingPriceMode(){
  const { mode, setMode } = usePriceMode()
  const [showTip, setShowTip] = useState(false)

  return (
    <div className="fixed z-50 bottom-4 left-1/2 -translate-x-1/2 md:left-4 md:top-1/2 md:-translate-y-1/2 md:bottom-auto md:translate-x-0" aria-label="價格模式切換">
      <div
        className="
          inline-flex items-stretch gap-2 max-w-[92vw] p-2
          bg-white/90 backdrop-blur rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.08)]
          border border-black/10
          flex-row md:flex-col
        "
      >
        {/* 批發價（桌機直排；手機橫排） */}
        <button
          className={cn(
            'px-3 py-2 rounded-2xl text-sm font-medium transition whitespace-nowrap',
            'md:[writing-mode:vertical-rl] md:[text-orientation:upright] md:leading-[1.1] md:tracking-[0.08em]',
            'md:min-h-[128px] md:px-2 md:py-3',
            mode==='wholesale' ? 'bg-black/90 text-white' : 'bg-black/5 text-ink hover:bg-black/10'
          )}
          aria-pressed={mode==='wholesale'}
          onClick={()=>setMode('wholesale')}
        >
          批發價
        </button>

        {/* 我會買到的價格（含 ⓘ） */}
        <div className="relative group">
          <button
            className={cn(
              'px-3 py-2 rounded-2xl text-sm font-medium transition inline-flex items-center gap-0.5 whitespace-nowrap',
              'md:[writing-mode:vertical-rl] md:[text-orientation:upright] md:leading-[1.1] md:tracking-[0.08em]',
              'md:min-h-[128px] md:px-2 md:py-3',
              mode==='retail' ? 'bg-black/90 text-white' : 'bg-black/5 text-ink hover:bg-black/10'
            )}
            aria-pressed={mode==='retail'}
            onClick={()=>setMode('retail')}
            aria-describedby={showTip ? 'retail-tip' : undefined}
          >
            我會買到的價格
            <span
              role="button"
              tabIndex={0}
              aria-label="估算法說明"
              onMouseEnter={()=>setShowTip(true)} onMouseLeave={()=>setShowTip(false)}
              onFocus={()=>setShowTip(true)} onBlur={()=>setShowTip(false)}
              className={cn(
                "inline-flex items-center justify-center w-5 h-5 rounded-full select-none md:mt-1",
                mode === 'retail' ? "bg-transparent text-white" : "bg-transparent text-black"
              )}
              title="估算法"
            >
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="pointer-events-none"
              >
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 16v-4"/>
                <path d="M12 8h.01"/>
              </svg>
            </span>
          </button>

          {/* Tooltip：手機在上方置中；桌機在右側置中 */}
          <div
            id="retail-tip" role="tooltip"
            className={cn(
              // mobile: top-center
              'absolute bottom-full mb-2 left-1/2 -translate-x-1/2',
              // desktop: right-center
              'md:bottom-auto md:top-1/2 md:left-full md:ml-3 md:-translate-y-1/2 md:translate-x-0',
              'w-[260px] p-3 rounded-2xl text-xs leading-relaxed shadow-md bg-white text-ink border border-black/10',
              (showTip ? 'block' : 'hidden'), 'group-hover:block'
            )}
          >
            <b>估算法：</b>零售 ≈ 批發 × 係數<br/>
            係數預設：葉菜 1.5／水果 1.7／根莖 1.3／其他 1.4<br/>
            （實際依地區與店家不同）
          </div>
        </div>
      </div>
    </div>
  )
}