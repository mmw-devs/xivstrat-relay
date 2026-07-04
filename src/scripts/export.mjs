#!/usr/bin/env node
/**
 * export.mjs — JSON → xivstrat 兼容 .astro 源文件编译导出
 *
 * 用法：node src/scripts/export.mjs [dutyPath]
 * 示例：node src/scripts/export.mjs 07/m5s
 *       默认导出所有 src/data/duties/ 下的 JSON
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '../..')
const DATA_DIR = path.join(ROOT, 'src/data/duties')
const OUT_DIR = path.join(ROOT, 'out')

// ─── 工具函数 ───────────────────────────────────────────

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath))
  fs.writeFileSync(filePath, content, 'utf-8')
  console.log(`  ✓ ${path.relative(ROOT, filePath)}`)
}

function indent(str, level = 1) {
  const pad = '  '.repeat(level)
  return str.split('\n').map(line => line ? pad + line : line).join('\n')
}

function escapeTemplate(str) {
  return str.replace(/`/g, '\\`').replace(/\$/g, '\\$')
}

// ─── 组件名映射 ────────────────────────────────────────

// 根据事件类型确定组件所在目录
function getComponentDir(name) {
  // _mechanics/ 下的组件
  const mechanics = [
    'DeepCut', 'FlipToXSide', 'DiscoInfernalP1', 'DiscoInfernalP2',
    'FunkyFloor', 'FunkyFloorP3', 'InsideOutOrOutsideIn',
    'ArcadyNightFever', 'ArcadyNightEncore', 'LetsDance', 'LetsDanceRemix',
    'LetsPose', 'RideTheWaves', 'Frogtourage', 'FrogtourageP3',
  ]
  if (mechanics.includes(name)) return '_mechanics'

  // _components/ 下的 Cast 组件
  const casts = [
    'FlipToXSideCast', 'XSnapTwistAndDropTheNeedleCast', 'PlayXSideCast',
    'CelebrateGoodTimesCast', 'DeepCutCast', 'EnsembleAssembleCast',
    'InsideOutOrOutsideInCast', 'MoveToCenterEvent',
  ]
  if (casts.includes(name)) return '_components'

  return null
}

// ─── 首页生成 ───────────────────────────────────────────

function generateIndexPage(duty) {
  const { dutyId, meta, waymark, macro, timeline, references, thanks } = duty

  // navList
  const navItems = []
  if (duty.cheatsheet) navItems.push({ label: '小抄速览', id: 'cheatsheet' })
  if (waymark) navItems.push({ label: '场地标点', id: 'waymark' })
  if (macro) navItems.push({ label: '宏', id: 'macro' })
  if (timeline) navItems.push({ label: '简易时间轴', id: 'timeline' })
  if (references && references.length > 0) navItems.push({ label: '参考资料', id: 'reference' })
  if (thanks) navItems.push({ label: '鸣谢', id: 'thanks' })

  const lines = []

  // --- frontmatter imports
  lines.push('---')
  lines.push("import { getEntry } from 'astro:content'")
  lines.push("import AreaBox from '@/components/AreaBox.astro'")
  lines.push("import CollapsibleBox from '@/components/CollapsibleBox.vue'")
  lines.push("import CosImage from '@/components/CosImage.astro'")
  lines.push("import Macro from '@/components/Macro.astro'")
  lines.push("import ReferenceItem from '@/components/ReferenceItem.astro'")
  lines.push("import ResizableImageDialog from '@/components/ResizableImageDialog.vue'")
  lines.push("import Thanks from '@/components/thanks/Thanks.astro'")
  lines.push("import WaymarkBox from '@/components/WaymarkBox.astro'")
  lines.push("import DutyHomeLayout from '@/layouts/DutyHomeLayout.astro'")
  lines.push("import BiliBiliSVG from '@/svg/bilibili.svg'")
  lines.push("import ScannerSVG from '@/svg/scanner.svg'")
  lines.push('')
  lines.push("import { macro } from './_data/macro'")
  lines.push("import { referenceList } from './_data/reference'")
  lines.push("import { thanksList } from './_data/thanks'")
  lines.push('')
  lines.push(`const dutyId = '${dutyId}'`)
  lines.push(`const duty = (await getEntry('duties', dutyId))!.data`)
  lines.push(`const navList = ${JSON.stringify(navItems)}`)
  lines.push(`const videoLink = duty.videoLink ?? undefined`)
  lines.push('---')
  lines.push('')

  // --- template
  lines.push('<DutyHomeLayout dutyId={dutyId} navList={navList}>')
  lines.push('  <Fragment slot="operation">')
  lines.push(`    <a href="/${dutyId}/p1">`)
  lines.push('      <button')
  lines.push('        class="flex w-max cursor-pointer items-center justify-between rounded-lg border border-purple-400 bg-purple-500 p-2 px-4 align-middle text-white hover:bg-purple-700/60 dark:border-purple-500 dark:bg-purple-700/75"')
  lines.push('      >')
  lines.push('        <ScannerSVG class="mr-2 h-5 w-5" />')
  lines.push('        查看正文')
  lines.push('      </button>')
  lines.push('    </a>')
  lines.push('    {')
  lines.push('      videoLink && (')
  lines.push('        <a href={videoLink} target="_blank">')
  lines.push('          <button class="flex w-max cursor-pointer items-center justify-between rounded-lg border border-blue-400 bg-blue-500 p-2 px-4 align-middle text-white hover:bg-blue-700/60 dark:border-blue-500 dark:bg-blue-700/75">')
  lines.push('            <BiliBiliSVG class="mr-2 h-5 w-5" />')
  lines.push('            跳转视频攻略')
  lines.push('          </button>')
  lines.push('        </a>')
  lines.push('      )')
  lines.push('    }')
  lines.push('  </Fragment>')

  // cheatsheet
  if (duty.cheatsheet) {
    lines.push('  <CollapsibleBox id="cheatsheet" client:idle class="w-full">')
    lines.push('    <Fragment slot="header">')
    lines.push('      <span>小抄速览</span>')
    lines.push('    </Fragment>')
    lines.push('    <AreaBox>')
    lines.push('      <ResizableImageDialog client:idle>')
    lines.push(`        <CosImage src="${duty.cheatsheet}" alt="${dutyId} 副本小抄" loading="lazy" class="h-full object-contain" />`)
    lines.push('      </ResizableImageDialog>')
    lines.push('    </AreaBox>')
    lines.push('  </CollapsibleBox>')
  }

  // waymark
  if (waymark) {
    lines.push('  <CollapsibleBox id="waymark" client:idle class="w-full">')
    const wmProps = [`href="${waymark.href}"`, `img="${waymark.img}"`]
    if (waymark.downloadLabel) wmProps.push(`downloadLabel="${waymark.downloadLabel}"`)
    if (waymark.pageNumber) wmProps.push(`pageNumber={${waymark.pageNumber}}`)
    if (waymark.slotStart) wmProps.push(`slotStart={${waymark.slotStart}}`)
    if (waymark.slotEnd) wmProps.push(`slotEnd={${waymark.slotEnd}}`)
    lines.push(`    <WaymarkBox ${wmProps.join(' ')} />`)
    lines.push('    <Fragment slot="header">')
    lines.push('      <span>场地标点</span>')
    lines.push('    </Fragment>')
    lines.push('  </CollapsibleBox>')
  }

  // macro
  if (macro) {
    lines.push('  <CollapsibleBox id="macro" client:idle class="w-full">')
    lines.push(`    <Macro text={macro} title="M5S站位" />`)
    lines.push('    <Fragment slot="header">')
    lines.push('      <span>宏</span>')
    lines.push('    </Fragment>')
    lines.push('  </CollapsibleBox>')
  }

  // timeline
  if (timeline) {
    lines.push('  <CollapsibleBox id="timeline" client:idle class="w-full">')
    lines.push('    <AreaBox>')
    lines.push('      <ResizableImageDialog client:idle>')
    lines.push(`        <CosImage src="${timeline}" alt="${dutyId} 简易时间轴" class="w-full object-contain" />`)
    lines.push('      </ResizableImageDialog>')
    lines.push('    </AreaBox>')
    lines.push('    <Fragment slot="header">')
    lines.push('      <span>简易时间轴</span>')
    lines.push('    </Fragment>')
    lines.push('  </CollapsibleBox>')
  }

  // references
  if (references && references.length > 0) {
    lines.push('  <CollapsibleBox id="reference" client:idle class="w-full">')
    lines.push('    <ReferenceItem list={referenceList} />')
    lines.push('    <Fragment slot="header">')
    lines.push('      <span>参考资料</span>')
    lines.push('    </Fragment>')
    lines.push('  </CollapsibleBox>')
  }

  // thanks
  if (thanks) {
    lines.push('  <CollapsibleBox id="thanks" client:idle class="w-full">')
    lines.push('    <Thanks devList={thanksList.devList} other={thanksList.other ?? []} groupList={thanksList.groupList} />')
    lines.push('    <Fragment slot="header">')
    lines.push('      <span>鸣谢</span>')
    lines.push('    </Fragment>')
    lines.push('  </CollapsibleBox>')
  }

  lines.push('</DutyHomeLayout>')
  lines.push('')

  return lines.join('\n')
}

// ─── 阶段页生成 ─────────────────────────────────────────

function collectImports(events) {
  const sectionImports = new Set()
  const componentImports = new Map() // name → dir
  const extraImports = new Set()

  // Base imports always needed
  sectionImports.add('AttackSection')
  sectionImports.add('EventSection')

  for (const evt of events) {
    switch (evt.type) {
      case 'separator':
        sectionImports.add('SeparatorSection')
        break
      case 'note':
        sectionImports.add('NoteSection')
        break
      case 'castSection':
        sectionImports.add('CastSection')
        break
      case 'mechanic': {
        const dir = getComponentDir(evt.id)
        if (dir) componentImports.set(evt.id, dir)
        else extraImports.add(evt.id)
        break
      }
      case 'cast': {
        const dir = getComponentDir(evt.component)
        if (dir) componentImports.set(evt.component, dir)
        else extraImports.add(evt.component)
        break
      }
      case 'eventComponent': {
        const dir = getComponentDir(evt.component)
        if (dir) componentImports.set(evt.component, dir)
        else extraImports.add(evt.component)
        break
      }
    }
  }

  return { sectionImports, componentImports, extraImports }
}

function generatePhasePage(duty, phase) {
  const { dutyId } = duty
  const { id, base, events } = phase
  const { sectionImports, componentImports, extraImports } = collectImports(events)

  const lines = []

  // --- frontmatter
  lines.push('---')

  // Section components
  for (const name of ['EventSection', 'AttackSection', 'SeparatorSection', 'NoteSection', 'CastSection'].sort()) {
    if (sectionImports.has(name)) {
      lines.push(`import ${name} from '@/components/section/${name}.astro'`)
    }
  }

  // Component imports
  for (const [name, dir] of componentImports) {
    lines.push(`import ${name} from './${dir}/${name}.astro'`)
  }

  // Extra imports (inline components used in events)
  if (extraImports.size > 0) {
    for (const name of extraImports) {
      lines.push(`// TODO: import ${name} — needs manual component resolution`)
    }
  }

  // Common imports
  const needsBoss = events.some(e => e.type === 'event' && e.text?.includes('Boss'))
  if (needsBoss) {
    lines.push("import Boss from '@/components/Boss.astro'")
    lines.push("import RoleIcon from '@/components/RoleIcon.astro'")
  }

  lines.push("import DutyStratLayout from '@/layouts/DutyStratLayout.astro'")
  lines.push("import { translations } from './_translations'")
  lines.push('')
  lines.push(`const dutyId = '${dutyId}'`)
  lines.push(`const base = ${base === '0' ? 0 : `'${base}'`}`)
  lines.push('---')
  lines.push('')

  // --- template
  lines.push('<DutyStratLayout dutyId={dutyId} base={base}>')

  for (const evt of events) {
    switch (evt.type) {
      case 'event': {
        const idAttr = evt.id ? ` id="${evt.id}"` : ''
        const text = escapeTextContent(evt.text || '')
        lines.push(`  <EventSection time="${evt.time}"${idAttr}>`)
        lines.push(`    ${text}`)
        lines.push('  </EventSection>')
        break
      }
      case 'attack':
        lines.push(`  <AttackSection time="${evt.time}" damage="${evt.damage}" damageType="${evt.damageType}" />`)
        break
      case 'separator': {
        if (evt.id && evt.title) {
          const tKey = findTranslationKey(duty.translations, evt.title)
          if (tKey) {
            lines.push(`  <SeparatorSection id="${evt.id}" title={translations.${tKey}} />`)
          } else {
            lines.push(`  <SeparatorSection id="${evt.id}" title="${evt.title}" />`)
          }
        } else if (evt.id) {
          lines.push(`  <SeparatorSection id="${evt.id}" />`)
        } else if (evt.title) {
          const tKey = findTranslationKey(duty.translations, evt.title)
          if (tKey) {
            lines.push(`  <SeparatorSection title={translations.${tKey}} />`)
          } else {
            lines.push(`  <SeparatorSection title="${evt.title}" />`)
          }
        } else {
          lines.push('  <SeparatorSection />')
        }
        break
      }
      case 'mechanic': {
        const props = []
        if (evt.start) props.push(`start="${evt.start}"`)
        if (evt.phase) props.push(`phase="${evt.phase}"`)
        if (evt.wavelengthStart) props.push(`wavelengthStart="${evt.wavelengthStart}"`)
        if (evt.getDownTimes) {
          props.push(`getDownTimes={${JSON.stringify(evt.getDownTimes)}}`)
        }
        lines.push(`  <${evt.id} ${props.join(' ')} />`)
        break
      }
      case 'note':
        lines.push('  <NoteSection>')
        lines.push(`    <div class="paragraph">${escapeTextContent(evt.text || '')}</div>`)
        lines.push('  </NoteSection>')
        break
      case 'cast': {
        const props = []
        if (evt.start) props.push(`start="${evt.start}"`)
        if (evt.time) props.push(`time="${evt.time}"`)
        lines.push(`  <${evt.component} ${props.join(' ')} />`)
        break
      }
      case 'eventComponent': {
        const props = []
        if (evt.time) props.push(`time="${evt.time}"`)
        lines.push(`  <${evt.component} ${props.join(' ')} />`)
        break
      }
      case 'castSection': {
        const props = [`start="${evt.start}"`, `duration={${evt.duration}}`]
        if (evt.ability) props.push(`ability="${evt.ability}"`)
        if (evt.damage) props.push(`damage="${evt.damage}"`)
        if (evt.damageType) props.push(`damageType="${evt.damageType}"`)
        if (evt.target) props.push('target')

        if (evt.badges && evt.badges.length > 0) {
          lines.push(`  <CastSection ${props.join(' ')}>`)
          for (const badge of evt.badges) {
            lines.push(`    <Badge variant="${badge.variant}">${badge.text}</Badge>`)
          }
          lines.push('  </CastSection>')
        } else {
          lines.push(`  <CastSection ${props.join(' ')} />`)
        }
        break
      }
    }
  }

  lines.push('</DutyStratLayout>')
  lines.push('')

  return lines.join('\n')
}

// ─── 数据文件生成 ────────────────────────────────────────

function generateMacroFile(macro) {
  return `/* eslint-disable no-irregular-whitespace */\n\nexport const macro = \`${escapeTemplate(macro)}\`\n`
}

function generateReferenceFile(references) {
  const items = references.map(ref => {
    const item = { url: ref.url, label: ref.label }
    if (ref.embed) item.embed = ref.embed
    return item
  })
  return `export const referenceList = ${JSON.stringify(items, null, 2)}\n`
}

function generateThanksFile(thanks) {
  return `export const thanksList = ${JSON.stringify(thanks, null, 2)}\n`
}

function generateTranslationsFile(translations) {
  const lines = ['export const translations = {']
  for (const [key, value] of Object.entries(translations)) {
    lines.push(`  ${key}: '${value.replace(/'/g, "\\'")}',`)
  }
  lines.push('}')
  lines.push('')
  return lines.join('\n')
}

function generateTranslationIndex() {
  return "export * from './cn'\n"
}

// ─── 辅助 ────────────────────────────────────────────────

function escapeTextContent(text) {
  // Escape special characters that could break JSX
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;')
}

function findTranslationKey(translations, value) {
  if (!translations) return null
  for (const [key, val] of Object.entries(translations)) {
    if (val === value) return key
  }
  return null
}

// ─── 主函数 ──────────────────────────────────────────────

function exportDuty(dutyPath) {
  const jsonPath = path.join(DATA_DIR, `${dutyPath}.json`)
  if (!fs.existsSync(jsonPath)) {
    console.error(`✗ 数据文件不存在: ${jsonPath}`)
    return false
  }

  const duty = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  const outBase = path.join(OUT_DIR, dutyPath)

  console.log(`\n📦 导出 ${dutyPath} → out/${dutyPath}/`)

  // 首页
  writeFile(path.join(outBase, 'index.astro'), generateIndexPage(duty))

  // 阶段页
  for (const phase of duty.phases) {
    writeFile(path.join(outBase, `${phase.id}.astro`), generatePhasePage(duty, phase))
  }

  // _data/
  if (duty.macro) {
    writeFile(path.join(outBase, '_data/macro.ts'), generateMacroFile(duty.macro))
  }
  if (duty.references && duty.references.length > 0) {
    writeFile(path.join(outBase, '_data/reference.ts'), generateReferenceFile(duty.references))
  }
  if (duty.thanks) {
    writeFile(path.join(outBase, '_data/thanks.ts'), generateThanksFile(duty.thanks))
  }

  // _translations/
  if (duty.translations) {
    writeFile(path.join(outBase, '_translations/cn.ts'), generateTranslationsFile(duty.translations))
    writeFile(path.join(outBase, '_translations/index.ts'), generateTranslationIndex())
  }

  return true
}

function exportAll() {
  if (!fs.existsSync(DATA_DIR)) {
    console.error('✗ 数据目录不存在:', DATA_DIR)
    return
  }

  const files = []
  function walk(dir, base = '') {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(path.join(dir, entry.name), base ? `${base}/${entry.name}` : entry.name)
      } else if (entry.name.endsWith('.json')) {
        files.push(base ? `${base}/${entry.name.replace('.json', '')}` : entry.name.replace('.json', ''))
      }
    }
  }
  walk(DATA_DIR)

  if (files.length === 0) {
    console.log('📭 无数据文件可导出')
    return
  }

  // 清理输出目录
  if (fs.existsSync(OUT_DIR)) {
    fs.rmSync(OUT_DIR, { recursive: true })
  }

  for (const f of files) {
    exportDuty(f)
  }

  console.log(`\n✅ 导出完成！共 ${files.length} 个副本 → out/`)
  console.log('   可将 out/ 目录内容复制到 xivstrat 的 src/pages/ 下')
}

// ─── 入口 ────────────────────────────────────────────────

const target = process.argv[2]
if (target) {
  if (fs.existsSync(OUT_DIR)) {
    // 不清除全部，仅覆盖此副本
  }
  ensureDir(OUT_DIR)
  exportDuty(target)
  console.log('\n✅ 导出完成！')
} else {
  exportAll()
}
