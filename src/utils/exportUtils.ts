import * as XLSX from 'xlsx';
import { Pegawai, PengaturanInstansi, KegiatanJurnal } from '../types';
import { PRESET_LOGO_PEMDA } from './presetLogos';

export const BULAN_INDONESIA = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const formatTanggalIndonesia = (dateStr: string): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const d = parseInt(parts[2], 10);
  const m = parseInt(parts[1], 10);
  const y = parts[0];
  return `${d.toString().padStart(2, '0')}-${m.toString().padStart(2, '0')}-${y}`;
};

export const exportJurnalToExcel = (
  pegawai: Pegawai,
  pengaturan: PengaturanInstansi,
  kegiatanList: KegiatanJurnal[],
  bulan: number,
  tahun: number,
  subJudulOverride?: string,
  judulOverride?: string,
  fileNameOverride?: string
) => {
  const bulanNama = BULAN_INDONESIA[bulan - 1] || 'Januari';
  const data: (string | number)[][] = [];

  // Header Dokumen
  data.push([(judulOverride || pengaturan.judulDokumen).toUpperCase()]);
  data.push([`${pegawai.jabatan.toUpperCase()}`]);
  data.push([subJudulOverride ? subJudulOverride.toUpperCase() : `BULAN ${bulanNama.toUpperCase()} ${tahun}`]);
  data.push([]);

  // Identitas Pegawai
  data.push(['NAMA', ':', pegawai.nama]);
  data.push(['NIP', ':', pegawai.nip]);
  data.push(['JABATAN', ':', pegawai.jabatan]);
  data.push(['UNIT KERJA', ':', pegawai.unitKerja]);
  data.push([]);

  // Header Tabel
  data.push([
    'No.',
    'Hari',
    'Tanggal',
    'Nomor Kegiatan',
    'Waktu',
    'Kegiatan / Pekerjaan',
    'Keluaran/Hasil (Output/Outcome)',
    'Validasi Atasan Langsung (paraf)'
  ]);

  // Baris Kegiatan
  kegiatanList.forEach((keg, index) => {
    const statusText = keg.statusValidasi === 'Disetujui' 
      ? 'Disetujui (Paraf Digital)' 
      : keg.statusValidasi === 'Ditolak' 
        ? 'Ditolak' 
        : 'Menunggu';

    data.push([
      index + 1,
      keg.hari,
      formatTanggalIndonesia(keg.tanggal),
      keg.nomorKegiatan || (index + 1).toString().padStart(2, '0'),
      `${keg.waktuMulai} - ${keg.waktuSelesai}`,
      keg.kegiatan,
      keg.outputHasil,
      statusText
    ]);
  });

  // Total Aktivitas
  data.push([]);
  data.push(['TOTAL AKTIVITAS KERJA', ':', kegiatanList.length]);
  data.push([]);

  // Tanda Tangan
  const tanggalHariIni = new Date();
  const tglFormatted = `${pengaturan.kotaPenetapan}, ${tanggalHariIni.getDate()} ${bulanNama} ${tahun}`;

  data.push(['', '', '', '', '', '', tglFormatted]);
  data.push(['Mengetahui :', '', '', '', '', '', 'Yang Membuat,']);
  data.push([pengaturan.jabatanAtasan, '', '', '', '', '', '']);
  data.push([]);
  data.push([]);
  data.push([pengaturan.namaAtasan, '', '', '', '', '', pegawai.nama]);
  data.push([pengaturan.pangkatAtasan, '', '', '', '', '', pegawai.pangkatGolongan]);
  data.push([`NIP. ${pengaturan.nipAtasan}`, '', '', '', '', '', `NIP. ${pegawai.nip}`]);

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 6 },  // No
    { wch: 10 }, // Hari
    { wch: 14 }, // Tanggal
    { wch: 16 }, // Nomor Kegiatan
    { wch: 16 }, // Waktu
    { wch: 45 }, // Kegiatan
    { wch: 45 }, // Keluaran/Hasil
    { wch: 25 }, // Validasi Atasan
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Jurnal_${bulanNama}_${tahun}`);

  const fileName = fileNameOverride || `Jurnal_${pegawai.nama.replace(/[^a-zA-Z0-9]/g, '_')}_${bulanNama}_${tahun}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export const exportJurnalToWord = (
  pegawai: Pegawai,
  pengaturan: PengaturanInstansi,
  kegiatanList: KegiatanJurnal[],
  bulan: number,
  tahun: number,
  subJudulOverride?: string,
  judulOverride?: string,
  fileNameOverride?: string
) => {
  const bulanNama = BULAN_INDONESIA[bulan - 1] || 'Januari';
  const tanggalHariIni = new Date();
  const tglPenetapan = `${pengaturan.kotaPenetapan}, ${tanggalHariIni.getDate()} ${bulanNama} ${tahun}`;

  let rowsHtml = '';
  kegiatanList.forEach((keg, idx) => {
    const isValid = keg.statusValidasi === 'Disetujui';
    const parafContent = isValid
      ? `<div style="font-size: 10px; color: #047857; text-align: center; font-weight: bold;">
          &#10004; TERVALIDASI<br/>
          <span style="font-size: 8px; color: #555;">${pengaturan.namaAtasan}</span>
         </div>`
      : keg.statusValidasi === 'Ditolak'
        ? `<div style="font-size: 10px; color: #b91c1c; text-align: center;">&#10008; Ditolak</div>`
        : `<div style="font-size: 10px; color: #d97706; text-align: center;">Menunggu</div>`;

    rowsHtml += `
      <tr>
        <td style="border: 1px solid #000; text-align: center; padding: 6px;">${idx + 1}</td>
        <td style="border: 1px solid #000; text-align: center; padding: 6px;">${keg.hari}</td>
        <td style="border: 1px solid #000; text-align: center; padding: 6px;">${formatTanggalIndonesia(keg.tanggal)}</td>
        <td style="border: 1px solid #000; text-align: center; padding: 6px;">${keg.nomorKegiatan || (idx + 1).toString().padStart(2, '0')}</td>
        <td style="border: 1px solid #000; text-align: center; padding: 6px;">${keg.waktuMulai} - ${keg.waktuSelesai}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: left;">&#9658; ${keg.kegiatan}</td>
        <td style="border: 1px solid #000; padding: 6px; text-align: left;">${keg.outputHasil}</td>
        <td style="border: 1px solid #000; padding: 6px; vertical-align: middle;">${parafContent}</td>
      </tr>
    `;
  });

  const logoToUse = pengaturan.logoUrl || PRESET_LOGO_PEMDA;
  const wordKopHtml = `
    <table style="width: 100%; border-collapse: collapse; border-bottom: 3px double #000; margin-bottom: 14px;">
      <tr>
        <td style="width: 75px; vertical-align: middle; text-align: left; border: none; padding-bottom: 8px;">
          <img src="${logoToUse}" width="70" height="70" alt="Logo" style="width: 70px; height: 70px; object-fit: contain;" />
        </td>
        <td style="text-align: center; vertical-align: middle; border: none; padding-bottom: 8px;">
          <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase;">${pengaturan.namaInstansi}</div>
          <div style="font-size: 13pt; font-weight: bold; text-transform: uppercase;">${pengaturan.badanDinas}</div>
          <div style="font-size: 10.5pt; font-weight: bold; text-transform: uppercase;">${pengaturan.bidangBagian || pegawai.unitKerja || ''}</div>
          <div style="font-size: 8.5pt; font-style: italic;">${pengaturan.alamat || ''}</div>
        </td>
        <td style="width: 75px; border: none;"></td>
      </tr>
    </table>
  `;

  const wordHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${pengaturan.judulDokumen}</title>
      <style>
        body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.3; }
        table { border-collapse: collapse; width: 100%; margin-top: 12px; }
        th { border: 1px solid #000; background-color: #f2f2f2; padding: 8px; font-weight: bold; font-size: 10pt; text-align: center; }
        td { font-size: 9.5pt; }
        .header-title { text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 2px; }
        .sub-title { text-align: center; font-weight: bold; font-size: 11pt; margin-bottom: 16px; }
        .bio-table { border: none; width: 100%; margin-bottom: 12px; }
        .bio-table td { border: none; padding: 2px 4px; font-size: 10pt; font-weight: bold; }
        .footer-table { border: none; width: 100%; margin-top: 25px; }
        .footer-table td { border: none; padding: 4px; font-size: 10pt; }
      </style>
    </head>
    <body>
      ${wordKopHtml}
      <div class="header-title">${(judulOverride || pengaturan.judulDokumen).toUpperCase()}</div>
      <div class="sub-title">${subJudulOverride ? subJudulOverride.toUpperCase() : `BULAN ${bulanNama.toUpperCase()} ${tahun}`}</div>

      <table class="bio-table">
        <tr>
          <td style="width: 140px;">NAMA</td>
          <td style="width: 15px;">:</td>
          <td>${pegawai.nama}</td>
        </tr>
        <tr>
          <td>NIP</td>
          <td>:</td>
          <td>${pegawai.nip}</td>
        </tr>
        <tr>
          <td>JABATAN</td>
          <td>:</td>
          <td>${pegawai.jabatan}</td>
        </tr>
        <tr>
          <td>UNIT KERJA</td>
          <td>:</td>
          <td>${pegawai.unitKerja}</td>
        </tr>
        ${pegawai.pangkatGolongan ? `<tr><td>PANGKAT / GOL.</td><td>:</td><td>${pegawai.pangkatGolongan}</td></tr>` : ''}
      </table>

      <table>
        <thead>
          <tr>
            <th style="width: 4%;">No.</th>
            <th style="width: 8%;">Hari</th>
            <th style="width: 10%;">Tanggal</th>
            <th style="width: 8%;">Nomor Kegiatan</th>
            <th style="width: 12%;">Waktu</th>
            <th style="width: 28%;">Kegiatan / Pekerjaan</th>
            <th style="width: 20%;">Keluaran / Hasil (Output / Outcome)</th>
            <th style="width: 10%;">Validasi Atasan Langsung (paraf)</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div style="margin-top: 14px; font-weight: bold; font-size: 10pt; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 5px 0;">
        TOTAL AKTIVITAS KERJA : ${kegiatanList.length}
      </div>

      <table class="footer-table">
        <tr>
          <td style="width: 50%; vertical-align: top;">
            Mengetahui :<br/>
            <strong>${pengaturan.jabatanAtasan}</strong><br/>
            ${pengaturan.badanDinas}
          </td>
          <td style="width: 50%; text-align: left; vertical-align: top; padding-left: 20px;">
            ${tglPenetapan}<br/>
            <strong>Yang Membuat,</strong>
          </td>
        </tr>
        <tr>
          <td style="height: 60px;"></td>
          <td style="height: 60px;"></td>
        </tr>
        <tr>
          <td style="vertical-align: top;">
            <strong><u>${pengaturan.namaAtasan}</u></strong><br/>
            ${pengaturan.pangkatAtasan}<br/>
            NIP. ${pengaturan.nipAtasan}
          </td>
          <td style="vertical-align: top; padding-left: 20px;">
            <strong><u>${pegawai.nama}</u></strong><br/>
            ${pegawai.pangkatGolongan}<br/>
            NIP. ${pegawai.nip}
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', wordHtml], {
    type: 'application/msword'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileNameOverride || `Jurnal_${pegawai.nama.replace(/[^a-zA-Z0-9]/g, '_')}_${bulanNama}_${tahun}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const generateFullPrintHtml = (
  pegawai: Pegawai,
  pengaturan: PengaturanInstansi,
  kegiatanList: KegiatanJurnal[],
  bulan: number,
  tahun: number,
  subJudulOverride?: string,
  judulOverride?: string
): string => {
  const bulanNama = BULAN_INDONESIA[bulan - 1] || 'Januari';
  const today = new Date();
  const tanggalTtd = `${pengaturan.kotaPenetapan}, ${today.getDate()} ${bulanNama} ${tahun}`;

  let rows = '';
  if (kegiatanList.length === 0) {
    rows = `<tr><td colspan="8" style="border: 1px solid #000; padding: 14px; text-align: center; font-style: italic;">Tidak ada kegiatan kerja tercatat pada periode ini.</td></tr>`;
  } else {
    kegiatanList.forEach((keg, idx) => {
      const isApproved = keg.statusValidasi === 'Disetujui';
      const paraf = isApproved
        ? `<div style="font-size: 9px; font-weight: bold; color: #047857; text-align: center;">&#10004; Disetujui<br/><span style="font-size: 8px; color: #555;">Paraf Elektronik</span></div>`
        : keg.statusValidasi === 'Ditolak'
          ? `<span style="font-size: 9px; color: #b91c1c; font-weight: bold;">Ditolak</span>`
          : `<span style="font-size: 9px; color: #d97706; font-style: italic;">Menunggu</span>`;

      rows += `
        <tr>
          <td style="border: 1px solid #000; padding: 5px; text-align: center;">${idx + 1}.</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: center;">${keg.hari}</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: center; white-space: nowrap;">${formatTanggalIndonesia(keg.tanggal)}</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold;">${keg.nomorKegiatan || (idx + 1).toString().padStart(2, '0')}</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: center; white-space: nowrap;">${keg.waktuMulai} - ${keg.waktuSelesai}</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: left;">&#9658; ${keg.kegiatan}</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: left;">${keg.outputHasil}</td>
          <td style="border: 1px solid #000; padding: 5px; text-align: center; vertical-align: middle;">${paraf}</td>
        </tr>
      `;
    });
  }

  const logoToUse = pengaturan.logoUrl || PRESET_LOGO_PEMDA;
  const kopHtml = `
    <table style="width: 100%; border-collapse: collapse; border-bottom: 3px double #000; margin-bottom: 14px;">
      <tr>
        <td style="width: 80px; vertical-align: middle; text-align: left; border: none; padding-bottom: 8px;">
          <img src="${logoToUse}" alt="Logo Instansi" style="max-height: 75px; max-width: 75px; object-fit: contain; display: block;" />
        </td>
        <td style="text-align: center; vertical-align: middle; border: none; padding-bottom: 8px;">
          <div style="font-size: 11pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;">${pengaturan.namaInstansi}</div>
          <div style="font-size: 13pt; font-weight: 900; text-transform: uppercase;">${pengaturan.badanDinas}</div>
          <div style="font-size: 10.5pt; font-weight: bold; text-transform: uppercase;">${pengaturan.bidangBagian || pegawai.unitKerja || ''}</div>
          <div style="font-size: 8.5pt; font-style: italic;">${pengaturan.alamat || ''}</div>
        </td>
        <td style="width: 80px; border: none;"></td>
      </tr>
    </table>
  `;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${judulOverride || pengaturan.judulDokumen} - ${pegawai.nama}</title>
  <style>
    @page { size: A4 landscape; margin: 8mm 10mm; }
    * { box-sizing: border-box; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; background: #fff; margin: 0; padding: 12px; }
    .doc-title { text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 2px; text-transform: uppercase; }
    .doc-sub { text-align: center; font-weight: bold; font-size: 11pt; margin-bottom: 14px; text-transform: uppercase; }
    table.data-table { width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 9.5pt; }
    table.data-table th { border: 1px solid #000; background-color: #f1f5f9; padding: 6px 4px; font-weight: bold; text-align: center; }
    table.data-table td { border: 1px solid #000; }
    .sig-table { width: 100%; border-collapse: collapse; border: none; margin-top: 25px; font-size: 10pt; }
    .sig-table td { border: none; vertical-align: top; }
  </style>
</head>
<body>
  ${kopHtml}
  <div class="doc-title">${(judulOverride || pengaturan.judulDokumen).toUpperCase()}</div>
  <div class="doc-sub">${subJudulOverride ? subJudulOverride.toUpperCase() : `BULAN ${bulanNama.toUpperCase()} ${tahun}`}</div>

  <table style="border: none; margin-bottom: 12px; font-weight: bold; font-size: 10pt;">
    <tr><td style="width: 130px;">NAMA</td><td style="width: 15px; text-align: center;">:</td><td style="text-transform: uppercase;">${pegawai.nama}</td></tr>
    <tr><td>NIP</td><td style="text-align: center;">:</td><td>${pegawai.nip}</td></tr>
    <tr><td>JABATAN</td><td style="text-align: center;">:</td><td style="text-transform: uppercase;">${pegawai.jabatan}</td></tr>
    <tr><td>UNIT KERJA</td><td style="text-align: center;">:</td><td style="text-transform: uppercase;">${pegawai.unitKerja}</td></tr>
    ${pegawai.pangkatGolongan ? `<tr><td>PANGKAT / GOL.</td><td style="text-align: center;">:</td><td>${pegawai.pangkatGolongan}</td></tr>` : ''}
  </table>

  <table class="data-table">
    <thead>
      <tr>
        <th style="width: 32px;">No.</th>
        <th style="width: 55px;">Hari</th>
        <th style="width: 80px;">Tanggal</th>
        <th style="width: 60px;">Nomor Kegiatan</th>
        <th style="width: 85px;">Waktu</th>
        <th>Kegiatan / Pekerjaan</th>
        <th>Keluaran/Hasil (Output/Outcome)</th>
        <th style="width: 110px;">Validasi Atasan Langsung (paraf)</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div style="border: 1px solid #000; border-top: none; padding: 5px 10px; font-weight: bold; font-size: 9.5pt; background: #f8fafc; text-align: right;">
    TOTAL AKTIVITAS KERJA : ${kegiatanList.length}
  </div>

  <table class="sig-table">
    <tr>
      <td style="width: 50%;">
        Mengetahui :<br/>
        <strong>${pengaturan.jabatanAtasan}</strong><br/>
        ${pengaturan.badanDinas}
      </td>
      <td style="width: 50%; padding-left: 30px;">
        ${tanggalTtd}<br/>
        <strong>Yang Membuat,</strong>
      </td>
    </tr>
    <tr>
      <td style="height: 55px; vertical-align: middle;">
        <span style="border: 1px dashed #94a3b8; padding: 2px 6px; font-size: 8pt; font-family: monospace; color: #475569;">[ TERPARAF ELEKTRONIK ]</span>
      </td>
      <td style="height: 55px; padding-left: 30px;"></td>
    </tr>
    <tr>
      <td>
        <strong><u>${pengaturan.namaAtasan}</u></strong><br/>
        ${pengaturan.pangkatAtasan}<br/>
        NIP. ${pengaturan.nipAtasan}
      </td>
      <td style="padding-left: 30px;">
        <strong><u>${pegawai.nama}</u></strong><br/>
        ${pegawai.pangkatGolongan}<br/>
        NIP. ${pegawai.nip}
      </td>
    </tr>
  </table>
</body>
</html>`;
};

export const printDocumentHtmlViaIframe = (contentHtml: string) => {
  const existing = document.getElementById('print-sandbox-iframe');
  if (existing) {
    existing.remove();
  }

  const iframe = document.createElement('iframe');
  iframe.id = 'print-sandbox-iframe';
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(contentHtml);
  doc.close();

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.warn('Iframe print blocked or failed, falling back to window.print():', err);
      window.print();
    } finally {
      setTimeout(() => {
        iframe.remove();
      }, 2500);
    }
  };

  // Wait for all images (especially the logo) to finish loading before print
  const images = Array.from(doc.images || []);
  if (images.length === 0) {
    setTimeout(triggerPrint, 350);
  } else {
    Promise.all(
      images.map((img) => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
        });
      })
    ).then(() => {
      setTimeout(triggerPrint, 300);
    });
  }
};

let helperCanvas: HTMLCanvasElement | null = null;
let helperCtx: CanvasRenderingContext2D | null = null;

export function resolveOklchColor(colorStr: string): string {
  if (!colorStr || typeof colorStr !== 'string' || !colorStr.includes('oklch')) {
    return colorStr;
  }
  if (!helperCanvas) {
    helperCanvas = document.createElement('canvas');
    helperCanvas.width = 1;
    helperCanvas.height = 1;
    helperCtx = helperCanvas.getContext('2d', { willReadFrequently: true });
  }
  if (!helperCtx) {
    return '#ffffff';
  }
  try {
    helperCtx.fillStyle = '#000000';
    helperCtx.fillStyle = colorStr;
    const computed = helperCtx.fillStyle;
    if (computed && !computed.includes('oklch')) {
      return computed;
    }
  } catch {
    // ignore
  }
  return '#ffffff';
}

/**
 * Executes an async action with CSSStyleDeclaration and window.getComputedStyle patched
 * so that any 'oklch' color function is automatically resolved to standard 'rgb(...)' or '#ffffff'.
 */
export async function withOklchSafeEnvironment<T>(action: () => Promise<T>): Promise<T> {
  const originalGetPropertyValue = CSSStyleDeclaration.prototype.getPropertyValue;
  const originalGetComputedStyle = window.getComputedStyle;

  try {
    // 1. Patch CSSStyleDeclaration.prototype.getPropertyValue
    CSSStyleDeclaration.prototype.getPropertyValue = function (property: string): string {
      const val = originalGetPropertyValue.call(this, property);
      if (typeof val === 'string' && val.includes('oklch')) {
        return resolveOklchColor(val);
      }
      return val;
    };

    // 2. Patch window.getComputedStyle with Proxy
    window.getComputedStyle = function (elt: Element, pseudoElt?: string | null): CSSStyleDeclaration {
      const realStyle = originalGetComputedStyle.call(window, elt, pseudoElt);
      return new Proxy(realStyle, {
        get(target, prop, receiver) {
          if (prop === 'getPropertyValue') {
            return (propertyName: string) => {
              const val = target.getPropertyValue(propertyName);
              return typeof val === 'string' && val.includes('oklch') ? resolveOklchColor(val) : val;
            };
          }
          const val = Reflect.get(target, prop, receiver);
          if (typeof val === 'string' && val.includes('oklch')) {
            return resolveOklchColor(val);
          }
          if (typeof val === 'function') {
            return val.bind(target);
          }
          return val;
        },
      });
    };

    return await action();
  } finally {
    CSSStyleDeclaration.prototype.getPropertyValue = originalGetPropertyValue;
    window.getComputedStyle = originalGetComputedStyle;
  }
}

export const exportJurnalHtmlToPdf = async (
  pegawai: Pegawai,
  pengaturan: PengaturanInstansi,
  kegiatanList: KegiatanJurnal[],
  bulan: number,
  tahun: number,
  fileName: string,
  orientation: 'landscape' | 'portrait' = 'landscape',
  subJudulOverride?: string,
  judulOverride?: string
) => {
  return withOklchSafeEnvironment(async () => {
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default || html2pdfModule;

    // Generate pure, clean HTML without any Tailwind classes or oklch colors
    const fullHtml = generateFullPrintHtml(pegawai, pengaturan, kegiatanList, bulan, tahun, subJudulOverride, judulOverride);

    const tempContainer = document.createElement('div');
    tempContainer.id = 'pdf-render-temp-container';
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '0';
    tempContainer.style.left = '0';
    tempContainer.style.zIndex = '-9999';
    tempContainer.style.opacity = '1';
    tempContainer.style.pointerEvents = 'none';
    tempContainer.style.width = orientation === 'landscape' ? '1120px' : '794px';
    tempContainer.style.backgroundColor = '#ffffff';
    tempContainer.style.color = '#000000';
    tempContainer.innerHTML = fullHtml;
    document.body.appendChild(tempContainer);

    // Wait for all images (logos, stamps) inside container to fully load and decode
    const images = Array.from(tempContainer.getElementsByTagName('img'));
    await Promise.all(
      images.map(async (img) => {
        if (!img.complete) {
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }
        if (img.decode) {
          try {
            await img.decode();
          } catch {
            // Ignore decode error if any
          }
        }
      })
    );
    // Allow paint cycle for base64 / vector rendering
    await new Promise((resolve) => setTimeout(resolve, 200));

    const opt = {
      margin: [8, 8, 8, 8] as [number, number, number, number],
      filename: fileName,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc: Document) => {
          // 1. Remove all main application stylesheets from clonedDoc.
          // They contain Tailwind CSS v4 variables with oklch(...) colors that crash html2canvas.
          // The container already has its own self-contained inline styling.
          const containerInClone = clonedDoc.getElementById('pdf-render-temp-container');
          const allStyles = Array.from(clonedDoc.querySelectorAll('style, link[rel="stylesheet"]'));
          allStyles.forEach((el) => {
            if (!containerInClone || !containerInClone.contains(el)) {
              el.remove();
            }
          });

          // 2. Patch clonedDoc defaultView getComputedStyle as a safety shield
          if (clonedDoc.defaultView) {
            const origGetComp = clonedDoc.defaultView.getComputedStyle;
            clonedDoc.defaultView.getComputedStyle = function (elt: Element, pseudo?: string | null) {
              const real = origGetComp.call(clonedDoc.defaultView, elt, pseudo);
              return new Proxy(real, {
                get(target, prop, receiver) {
                  if (prop === 'getPropertyValue') {
                    return (propName: string) => {
                      const val = target.getPropertyValue(propName);
                      return typeof val === 'string' && val.includes('oklch') ? resolveOklchColor(val) : val;
                    };
                  }
                  const val = Reflect.get(target, prop, receiver);
                  if (typeof val === 'string' && val.includes('oklch')) {
                    return resolveOklchColor(val);
                  }
                  if (typeof val === 'function') {
                    return val.bind(target);
                  }
                  return val;
                }
              });
            };
          }

          // 3. Inject pristine, clean print styles
          const cleanStyle = clonedDoc.createElement('style');
          cleanStyle.textContent = `
            * { box-sizing: border-box; }
            body, table, th, td, div, span, p { font-family: 'Times New Roman', Times, serif; color: #000000; }
            table { border-collapse: collapse; }
            img { max-width: 100%; display: block; }
          `;
          clonedDoc.head.appendChild(cleanStyle);
        }
      },
      jsPDF: { unit: 'mm' as const, format: 'a4', orientation },
      pagebreak: { mode: ['avoid-all' as const, 'css' as const] }
    };

    try {
      await html2pdf().set(opt).from(tempContainer).save();
    } finally {
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
    }
  });
};

export const exportElementToPdf = async (
  element: HTMLElement,
  fileName: string,
  orientation: 'landscape' | 'portrait' = 'landscape'
) => {
  return withOklchSafeEnvironment(async () => {
    const html2pdfModule = await import('html2pdf.js');
    const html2pdf = html2pdfModule.default || html2pdfModule;

    const images = Array.from(element.getElementsByTagName('img'));
    await Promise.all(
      images.map(async (img) => {
        if (!img.complete) {
          await new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        }
        if (img.decode) {
          try {
            await img.decode();
          } catch {
            // ignore
          }
        }
      })
    );
    await new Promise((resolve) => setTimeout(resolve, 150));

    const opt = {
      margin: [8, 8, 8, 8] as [number, number, number, number],
      filename: fileName,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc: Document) => {
          const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
          styles.forEach((styleTag) => {
            if (styleTag.textContent && styleTag.textContent.includes('oklch')) {
              styleTag.textContent = styleTag.textContent.replace(/oklch\([^)]+\)/g, '#ffffff');
            }
          });
          if (clonedDoc.defaultView) {
            const origGetComp = clonedDoc.defaultView.getComputedStyle;
            clonedDoc.defaultView.getComputedStyle = function (elt: Element, pseudo?: string | null) {
              const real = origGetComp.call(clonedDoc.defaultView, elt, pseudo);
              return new Proxy(real, {
                get(target, prop, receiver) {
                  if (prop === 'getPropertyValue') {
                    return (propName: string) => {
                      const val = target.getPropertyValue(propName);
                      return typeof val === 'string' && val.includes('oklch') ? resolveOklchColor(val) : val;
                    };
                  }
                  const val = Reflect.get(target, prop, receiver);
                  if (typeof val === 'string' && val.includes('oklch')) {
                    return resolveOklchColor(val);
                  }
                  if (typeof val === 'function') {
                    return val.bind(target);
                  }
                  return val;
                }
              });
            };
          }
        }
      },
      jsPDF: { unit: 'mm' as const, format: 'a4', orientation },
      pagebreak: { mode: ['avoid-all' as const, 'css' as const] }
    };
    await html2pdf().set(opt).from(element).save();
  });
};
