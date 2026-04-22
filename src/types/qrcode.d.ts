declare module 'qrcode' {
  type ToDataURLOptions = {
    margin?: number
    width?: number
    color?: {
      dark?: string
      light?: string
    }
  }

  type ToCanvasOptions = ToDataURLOptions

  const QRCode: {
    toDataURL(text: string, options?: ToDataURLOptions): Promise<string>
    toCanvas(
      canvasElement: HTMLCanvasElement,
      text: string,
      options?: ToCanvasOptions,
    ): Promise<void>
  }

  export default QRCode
}
