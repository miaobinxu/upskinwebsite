import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toPng } from "html-to-image";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const convertImageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};



export const generateScreenshotInNewTab = async (htmlContent: string, width = 360, height = 640) => {
  const newWindow = window.open("", "_blank", `width=${width},height=${height}`);

  if (!newWindow) {
    alert("Unable to open new window. Please allow popups.");
    return;
  }

  // Write HTML shell
  newWindow.document.write(`
    <html>
      <head>
      //  <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body {
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #fff;
            height: 100vh;
            font-family: 'Inter', sans-serif;
          }
        </style>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <div id="capture-area">${htmlContent}</div>
      </body>
    </html>
  `);

  newWindow.document.close();

  await new Promise((resolve) => setTimeout(resolve, 1000));

  const captureElement = newWindow.document.getElementById("capture-area");
  if (!captureElement) return;

  const dataUrl = await toPng(captureElement, {
    cacheBust: true,
    pixelRatio: 2,
    skipFonts:true,
    backgroundColor: "#fff",
  });

  const link = newWindow.document.createElement("a");
  link.href = dataUrl;
  link.download = "screenshot.png";
  link.click();

  // Optional: Close the tab after download
  setTimeout(() => {
    newWindow.close();
  }, 1000);
};