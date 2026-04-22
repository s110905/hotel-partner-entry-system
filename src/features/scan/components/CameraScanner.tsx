import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'

type Props = {
  onDetect: (data: string) => void
  onClose: () => void
}

export function CameraScanner({ onDetect, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const onDetectRef = useRef(onDetect)
  const [facing, setFacing] = useState<'environment' | 'user'>('environment')
  const [error, setError] = useState<string | null>(null)

  // Keep ref current without re-triggering the camera effect
  onDetectRef.current = onDetect

  useEffect(() => {
    let cancelled = false
    let rafId = 0

    function tick() {
      if (cancelled) return
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(video, 0, 0)
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const result = jsQR(imgData.data, imgData.width, imgData.height)
          if (result?.data) {
            streamRef.current?.getTracks().forEach(t => t.stop())
            onDetectRef.current(result.data)
            return
          }
        }
      }
      rafId = requestAnimationFrame(tick)
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: facing } } })
      .then(stream => {
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          video.play()
            .then(() => { rafId = requestAnimationFrame(tick) })
            .catch(() => { if (!cancelled) setError('視訊啟動失敗') })
        }
      })
      .catch(() => {
        if (!cancelled) setError('無法存取相機，請確認已授予相機權限，或改用選取方式。')
      })

    return () => {
      cancelled = true
      cancelAnimationFrame(rafId)
      streamRef.current?.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
  }, [facing])

  if (error) {
    return (
      <div className="scan-camera-error">
        <p>{error}</p>
        <button type="button" className="scan-btn-confirm" onClick={onClose}>
          關閉
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="scan-camera-wrap">
        <video ref={videoRef} className="scan-camera-video" playsInline muted />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <div className="scan-camera-overlay">
          <div className="scan-camera-frame" />
          <p className="scan-camera-hint">將 QR 對準框內，自動偵測</p>
        </div>
      </div>
      <div className="scan-camera-actions">
        <button
          type="button"
          className="scan-camera-flip-btn"
          onClick={() => setFacing(f => f === 'environment' ? 'user' : 'environment')}
        >
          翻轉鏡頭
        </button>
        <button type="button" className="scan-camera-cancel-btn" onClick={onClose}>
          取消掃描
        </button>
      </div>
    </div>
  )
}
