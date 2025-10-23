/**
 * Analyzes migration files for patterns that might cause data loss.
 * Run this before applying migrations or in CI.
 */

import fs from 'fs'
import path from 'path'

const DANGEROUS_PATTERNS = [
  {
    pattern: /\bDROP\b/i,
    message: 'DROP keyword detected - review for data loss',
  },
  {
    pattern: /\bDELETE\b/i,
    message: 'DELETE keyword detected - review for data loss',
  },
  {
    pattern: /\bTRUNCATE\b/i,
    message: 'TRUNCATE keyword detected - review for data loss',
  },
  {
    pattern: /\bALTER\b/i,
    message: 'ALTER keyword detected - review for data loss',
  },
  {
    pattern: /\bRENAME\b/i,
    message: 'RENAME keyword detected - review for data loss',
  },
  {
    pattern: /PRAGMA foreign_keys\s*=\s*OFF/i,
    message: 'Foreign keys disabled - cascade behavior may be unpredictable',
  },
] as const

interface Finding {
  file: string
  line: number
  pattern: string
  message: string
  code: string
  isKnownIssue?: boolean
}

function analyzeMigrationFile(filePath: string): Finding[] {
  const content = fs.readFileSync(filePath, 'utf-8')
  const findings: Finding[] = []

  // Extract only the `up` function content
  const upFunctionMatch = content.match(
    /export\s+async\s+function\s+up\s*\([^)]*\)\s*:?\s*[^{]*\{([\s\S]*?)^}/m,
  )

  if (!upFunctionMatch) {
    console.warn(`⚠️  Could not find 'up' function in ${path.basename(filePath)}`)
    return findings
  }

  const upFunctionContent = upFunctionMatch[1]
  const upFunctionStartLine = content.substring(0, upFunctionMatch.index).split('\n').length + 1

  // Check for known issue: PRAGMA foreign_keys=OFF + table recreation pattern
  // This causes data loss in Turso/libSQL due to cascade delete behavior differences
  const hasForeignKeysOff = /PRAGMA foreign_keys\s*=\s*OFF/i.test(upFunctionContent)
  const hasTableRecreation = /__new_/i.test(upFunctionContent)
  const hasDropTable = /DROP TABLE/i.test(upFunctionContent)
  const hasRename = /RENAME TO/i.test(upFunctionContent)

  if (hasForeignKeysOff && hasTableRecreation && hasDropTable && hasRename) {
    // Find the line with PRAGMA foreign_keys=OFF to report
    const lines = upFunctionContent.split('\n')
    const pragmaLineIndex = lines.findIndex((line) => /PRAGMA foreign_keys\s*=\s*OFF/i.test(line))
    if (pragmaLineIndex !== -1) {
      findings.push({
        file: path.basename(filePath),
        line: upFunctionStartLine + pragmaLineIndex,
        pattern: 'KNOWN ISSUE: PRAGMA foreign_keys=OFF + table recreation',
        message:
          '🚨 KNOWN ISSUE: Table recreation with foreign_keys=OFF causes data loss in Turso production. ' +
          'Turso does not respect PRAGMA FOREIGN_KEYS=off in transactions, causing cascade deletes in _rels tables. ' +
          'This migration WILL cause data loss in production if this table has foreign key relationships.',
        code: lines[pragmaLineIndex].trim(),
        isKnownIssue: true,
      })
    }
  }

  // Check for individual dangerous patterns
  upFunctionContent.split('\n').forEach((line, relativeIndex) => {
    const absoluteLine = upFunctionStartLine + relativeIndex
    for (const { pattern, message } of DANGEROUS_PATTERNS) {
      if (pattern.test(line)) {
        findings.push({
          file: path.basename(filePath),
          line: absoluteLine,
          pattern: pattern.source,
          message,
          code: line.trim(),
        })
      }
    }
  })

  return findings
}

function checkMigrations(migrationsDir: string, specificFile?: string) {
  const files = specificFile
    ? [path.join(migrationsDir, specificFile)]
    : fs
        .readdirSync(migrationsDir)
        .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
        .map((f) => path.join(migrationsDir, f))

  let totalFindings = 0
  const fileFindings: { file: string; findings: Finding[] }[] = []

  console.log('\n🔍 Analyzing migrations for potential data loss...\n')

  for (const file of files) {
    const findings = analyzeMigrationFile(file)

    if (findings.length > 0) {
      fileFindings.push({ file: path.basename(file), findings })
      console.log(`📄 ${path.basename(file)}:`)
      findings.forEach((finding) => {
        const icon = finding.isKnownIssue ? '🚨' : '⚠️'
        console.log(`  ${icon}  Line ${finding.line}: ${finding.message}`)
        console.log(`     ${finding.code}`)
        totalFindings++
      })
      console.log('')
    }
  }

  if (totalFindings === 0) {
    console.log('✅ No concerning patterns detected\n')
    return 0
  } else {
    console.log(`⚠️  Found ${totalFindings} potential issues\n`)
    console.log('Please review this migration and make any modifications to avoid data loss.')

    // Output GitHub-friendly format if in CI
    if (process.env.GITHUB_OUTPUT) {
      const comment = generateGitHubComment(fileFindings)
      fs.appendFileSync(process.env.GITHUB_OUTPUT, `comment<<EOF\n${comment}\nEOF\n`)
    }

    return 1
  }
}

function generateGitHubComment(fileFindings: { file: string; findings: Finding[] }[]): string {
  const totalIssues = fileFindings.reduce((sum, f) => sum + f.findings.length, 0)
  const knownIssues = fileFindings.flatMap((f) => f.findings).filter((f) => f.isKnownIssue)
  const hasKnownIssues = knownIssues.length > 0

  let comment = hasKnownIssues
    ? '### Migration Safety Check - Known Issue Detected\n\n'
    : '### Migration Safety Check\n\n'

  if (hasKnownIssues) {
    comment +=
      '> This migration contains a known issue that will cause data loss in production.\n\n'
  }

  comment += `Found ${totalIssues} potential issue${totalIssues === 1 ? '' : 's'}:\n\n`

  for (const { file, findings } of fileFindings) {
    comment += `**${file}**\n\n`
    for (const finding of findings) {
      const label = finding.isKnownIssue ? 'Known issue' : 'Warning'
      comment += `${label} (line ${finding.line}): ${finding.message}\n`
      comment += `\`\`\`sql\n${finding.code}\n\`\`\`\n\n`
    }
  }

  comment += '---\n\n'
  if (hasKnownIssues) {
    comment += 'Known issues require manual migration modification to prevent data loss. '
  } else {
    comment += 'Review these patterns and add backup/restore logic if needed. '
  }
  comment += 'See `docs/migration-safety.md` for guidance.\n'

  return comment
}

// CLI usage
const migrationsDir = path.join(process.cwd(), 'src/migrations')
const specificFile = process.argv[2] // Optional: check specific file

const exitCode = checkMigrations(migrationsDir, specificFile)
process.exit(exitCode)
