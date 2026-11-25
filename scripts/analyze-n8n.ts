/**
 * Analiza los workflows de N8N exportados en n8n-backup/
 *
 * Detecta:
 * - Cuántos workflows hay
 * - Cuáles parecen ser parsers de email
 * - Qué regex/código JS está embebido en nodos Code
 * - Qué bancos/formatos se manejan
 *
 * Uso: npm run analyze:n8n
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BACKUP_DIR = 'n8n-backup';

interface N8nNode {
  id: string;
  name: string;
  type: string;
  parameters?: Record<string, unknown>;
  typeVersion?: number;
}

interface N8nWorkflow {
  id?: string;
  name: string;
  nodes: N8nNode[];
  active?: boolean;
  settings?: Record<string, unknown>;
}

interface ParsedWorkflow {
  file: string;
  name: string;
  active: boolean;
  nodeCount: number;
  hasGmailTrigger: boolean;
  hasCodeNode: boolean;
  hasHttpRequest: boolean;
  codeNodes: { name: string; code: string }[];
  bankHint: string | null;
}

function detectBank(name: string): string | null {
  const lower = name.toLowerCase();
  const banks = [
    'popular', 'banreservas', 'bhd', 'scotiabank', 'scotia',
    'apap', 'bancoleon', 'bhdleon', 'santa cruz', 'cibao',
    'bni', 'promerica', 'asoc', 'coop', 'bonanza', 'lopez de haro',
    'caribe', 'blh', 'alaver', 'vimenca', 'bancamerica',
  ];
  for (const bank of banks) {
    if (lower.includes(bank)) return bank;
  }
  return null;
}

function extractCodeFromNode(node: N8nNode): string {
  const params = node.parameters as Record<string, unknown> | undefined;
  if (!params) return '';
  return (
    (params.jsCode as string) ||
    (params.code as string) ||
    (params.functionCode as string) ||
    ''
  );
}

function analyzeWorkflow(filePath: string): ParsedWorkflow | null {
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const wf = JSON.parse(raw) as N8nWorkflow;

    if (!wf.nodes || !Array.isArray(wf.nodes)) return null;

    const codeNodes = wf.nodes
      .filter((n) => n.type.includes('code') || n.type.includes('function'))
      .map((n) => ({ name: n.name, code: extractCodeFromNode(n) }))
      .filter((n) => n.code);

    return {
      file: filePath,
      name: wf.name,
      active: !!wf.active,
      nodeCount: wf.nodes.length,
      hasGmailTrigger: wf.nodes.some(
        (n) => n.type.includes('gmail') || n.type.includes('imap')
      ),
      hasCodeNode: codeNodes.length > 0,
      hasHttpRequest: wf.nodes.some(
        (n) => n.type.includes('httpRequest') || n.type.includes('http')
      ),
      codeNodes,
      bankHint: detectBank(wf.name),
    };
  } catch (err) {
    console.error(`Error leyendo ${filePath}:`, (err as Error).message);
    return null;
  }
}

function main() {
  console.log('\n🔍 Analizando workflows de N8N en n8n-backup/\n');

  let files: string[];
  try {
    files = readdirSync(BACKUP_DIR)
      .filter((f) => f.endsWith('.json'))
      .filter((f) => {
        const fullPath = join(BACKUP_DIR, f);
        return statSync(fullPath).isFile();
      });
  } catch (err) {
    console.error(`❌ No se encontró la carpeta ${BACKUP_DIR}/`);
    console.error('   Exportá tus workflows primero. Mirá n8n-backup/README.md');
    process.exit(1);
  }

  if (files.length === 0) {
    console.log('⚠️  No hay archivos .json en n8n-backup/');
    console.log('   Exportá tus workflows. Mirá n8n-backup/README.md\n');
    process.exit(0);
  }

  console.log(`📁 Encontrados ${files.length} archivo(s)\n`);

  const workflows: ParsedWorkflow[] = [];
  for (const file of files) {
    const wf = analyzeWorkflow(join(BACKUP_DIR, file));
    if (wf) workflows.push(wf);
  }

  const totalCodeNodes = workflows.reduce((s, w) => s + w.codeNodes.length, 0);
  const totalCodeChars = workflows.reduce(
    (s, w) => s + w.codeNodes.reduce((ss, c) => ss + c.code.length, 0),
    0
  );

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 RESUMEN GENERAL');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Workflows totales:        ${workflows.length}`);
  console.log(`  Workflows activos:        ${workflows.filter((w) => w.active).length}`);
  console.log(`  Con Gmail/IMAP trigger:   ${workflows.filter((w) => w.hasGmailTrigger).length}`);
  console.log(`  Con nodos Code/Function:  ${workflows.filter((w) => w.hasCodeNode).length}`);
  console.log(`  Total nodos Code:         ${totalCodeNodes}`);
  console.log(`  Total chars de código:    ${totalCodeChars.toLocaleString()}`);
  console.log('');

  const emailWorkflows = workflows.filter(
    (w) => w.hasGmailTrigger || w.hasCodeNode
  );

  if (emailWorkflows.length === 0) {
    console.log('⚠️  No se detectaron workflows de email.');
    console.log('   Mostrando todos los workflows igualmente:\n');
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📋 WORKFLOWS DE EMAIL DETECTADOS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  for (const wf of emailWorkflows) {
    const status = wf.active ? '🟢 ACTIVO' : '⚪ inactivo';
    const bank = wf.bankHint ? `[${wf.bankHint}]` : '';
    console.log(`${status} ${wf.name} ${bank}`);
    console.log(`   Archivo:      ${wf.file}`);
    console.log(`   Nodos:        ${wf.nodeCount}`);
    console.log(`   Gmail/IMAP:   ${wf.hasGmailTrigger ? 'sí' : 'no'}`);
    console.log(`   Code nodes:   ${wf.codeNodes.length}`);

    if (wf.codeNodes.length > 0) {
      const totalChars = wf.codeNodes.reduce((s, c) => s + c.code.length, 0);
      console.log(`   Código total: ${totalChars} caracteres`);

      console.log(`\n   📝 Nodos Code:`);
      for (const cn of wf.codeNodes) {
        const preview = cn.code.slice(0, 200).replace(/\n/g, ' ');
        console.log(`      • ${cn.name} (${cn.code.length} chars)`);
        console.log(`        ${preview}${cn.code.length > 200 ? '...' : ''}`);
      }
    }
    console.log('');
  }

  const banksDetected = new Set(
    emailWorkflows.map((w) => w.bankHint).filter(Boolean)
  );
  if (banksDetected.size > 0) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏦 BANCOS DETECTADOS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    for (const bank of banksDetected) {
      console.log(`  • ${bank}`);
    }
    console.log('');
  }

  const workflowsWithoutBank = emailWorkflows.filter((w) => !w.bankHint);
  if (workflowsWithoutBank.length > 0) {
    console.log('⚠️  Workflows sin banco detectado en el nombre:');
    for (const wf of workflowsWithoutBank) {
      console.log(`   • ${wf.name} (${wf.file})`);
    }
    console.log(
      '   Considerá renombrarlos o agregar el banco en el nombre para mejor organización.\n'
    );
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ Análisis completo');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main();