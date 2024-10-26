import crypto from 'crypto'

export async function up({ schema }) {
  await schema.table('settings', table => {
    table.string('totpSecret').defaultTo(crypto.randomUUID())
  })
}

export async function down({ schema }) {
  await schema.table('settings', table => {
    table.dropColumn('totpSecret')
  })
}
