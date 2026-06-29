import { Alsintan } from '../types';
import { rawCsvData } from './rawCsv';

export function parseBabelCsvData(): Alsintan[] {
  const lines = rawCsvData.trim().split('\n');
  const result: Alsintan[] = [];
  
  // Clean up any empty lines
  const dataLines = lines.filter(line => line.trim() !== '');
  
  // Helper to map Kabupaten to brigadeId
  function getBrigadeId(kab: string): string {
    const k = kab.toLowerCase();
    if (k.includes('selatan')) return 'brg-006'; // Bangka Selatan
    if (k.includes('barat')) return 'brg-007';   // Bangka Barat
    if (k.includes('tengah')) return 'brg-009';  // Bangka Tengah
    if (k.includes('timur')) return 'brg-011';   // Belitung Timur
    if (k.includes('belitung')) return 'brg-010'; // Belitung
    return 'brg-008';                            // Bangka
  }

  // Helper to map CSV Alsintan name to types
  function mapAlsintanType(rawName: string): 'Traktor Roda 2' | 'Traktor Roda 4' | 'Combine Harvester' | 'Pompa Air' | 'Rice Transplanter' {
    const name = rawName.toLowerCase();
    if (name.includes('roda 2') || name.includes('handtraktor') || name.includes('cultivator')) {
      return 'Traktor Roda 2';
    }
    if (name.includes('roda 4') || name.includes('crawler') || name.includes('tr4')) {
      return 'Traktor Roda 4';
    }
    if (name.includes('combine') || name.includes('thresher') || name.includes('threser')) {
      return 'Combine Harvester';
    }
    if (name.includes('pompa') || name.includes('steam') || name.includes('sprayer') || name.includes('handsprayer')) {
      return 'Pompa Air';
    }
    return 'Rice Transplanter';
  }

  // Helper to extract known brand
  function extractBrand(alsName: string, gapoktan: string): string {
    const name = alsName.toLowerCase();
    if (name.includes('kubota')) return 'Kubota';
    if (name.includes('yanmar')) return 'Yanmar';
    if (name.includes('john deere') || name.includes('deere')) return 'John Deere';
    if (name.includes('quick')) return 'Quick';
    if (name.includes('honda')) return 'Honda';
    if (name.includes('kronos')) return 'Kronos';
    
    // Default to the Gapoktan or a clean default
    if (gapoktan && gapoktan.trim().length > 3) {
      return gapoktan.replace(/^(Gapoktan|Poktan|UPJA|Gap\.|BP)\s+/i, '').split(' ')[0] || 'Kementan';
    }
    return 'Kementan';
  }

  let rowCounter = 0;
  
  for (const line of dataLines) {
    const parts = line.split(';');
    if (parts.length < 9) continue;
    
    const noStr = parts[0].trim();
    // Verify first column is a row number
    if (!/^\d+$/.test(noStr)) continue;
    
    rowCounter++;
    
    const kab = parts[1].trim();
    const kec = parts[2].trim();
    const desa = parts[3].trim();
    const gapoktan = parts[4].trim();
    const penerima = parts[5].trim();
    const komoditas = parts[6].trim();
    const rawAlsName = parts[7].trim();
    const rawQty = parts[8].trim();
    const rawYear = parts[9].trim();
    const anggaran = parts[10].trim();
    const keterangan = parts[11] ? parts[11].trim() : '';

    const brigadeId = getBrigadeId(kab);
    const mappedType = mapAlsintanType(rawAlsName);
    const brand = extractBrand(rawAlsName, gapoktan);
    
    // Parse quantity (clean spaces, etc.)
    let qty = parseInt(rawQty.replace(/\s+/g, ''), 10);
    if (isNaN(qty) || qty <= 0) qty = 1;
    
    // Parse year
    let year = parseInt(rawYear, 10);
    if (isNaN(year)) year = 2024;
    
    // Parse status
    let status: 'Aktif' | 'Service' | 'Rusak' | 'Standby' = 'Aktif';
    const ketLower = keterangan.toLowerCase();
    if (ketLower.includes('rusak') || ketLower.includes('hilang') || ketLower.includes('turun')) {
      status = 'Rusak';
    } else if (ketLower.includes('service') || ketLower.includes('perbaikan')) {
      status = 'Service';
    } else if (ketLower.includes('baik') || ketLower.includes('aktif') || ketLower.includes('normal')) {
      status = 'Aktif';
    } else {
      status = 'Standby';
    }

    // Determine clean code prefix
    let prefix = 'TR2';
    if (mappedType === 'Traktor Roda 4') prefix = 'TR4';
    if (mappedType === 'Combine Harvester') prefix = 'CMB';
    if (mappedType === 'Pompa Air') prefix = 'PMP';
    if (mappedType === 'Rice Transplanter') prefix = 'TRP';

    // Generate up to Qty items, but cap at 5 per entry to keep list clean yet fully representative
    const maxGenQty = Math.min(qty, 5);
    for (let u = 1; u <= maxGenQty; u++) {
      const unitSuffix = qty > 1 ? `-${u}` : '';
      const displayQty = qty > 1 ? ` [Unit ${u}/${qty}]` : '';
      
      const id = `als-csv-${brigadeId}-${rowCounter}-${u}`;
      const code = `AL-${prefix}-${kab.substring(0, 3).toUpperCase()}-${rowCounter.toString().padStart(3, '0')}${unitSuffix}`;
      
      // Construct a very rich and descriptive name
      let displayName = `${rawAlsName} ${gapoktan ? gapoktan : ''}`;
      if (desa) displayName += ` (${desa})`;
      displayName = displayName.replace(/\s+/g, ' ').trim() + displayQty;

      // Model name combining recipient and village/district
      let model = penerima ? `${penerima}` : '';
      if (kec) model += ` (${kec})`;
      if (!model) model = rawAlsName;

      result.push({
        id,
        code,
        name: displayName,
        type: mappedType,
        brand: brand,
        model: model,
        year: year,
        status: status,
        brigadeId: brigadeId
      });
    }
  }

  return result;
}
