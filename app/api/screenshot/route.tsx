// app/api/screenshot/route.ts
import { NextRequest } from 'next/server'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

export const POST = async (req: NextRequest) => {
  try {
    const { html, options } = await req.json()

    if (!html) return new Response('Missing HTML', { status: 400 })

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
      defaultViewport: options?.viewport ?? { width: 600, height: 800 },
    })

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })

    const screenshot = await page.screenshot({
      type: options?.type ?? 'png',
      omitBackground: options?.omitBackground ?? false,
    })

    await browser.close()

    return new Response(screenshot, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="screenshot.png"',
      },
    })
  } catch (err: any) {
    console.error('Screenshot API error:', err)
    return new Response('Screenshot failed', { status: 500 })
  }
}
