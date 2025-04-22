/**
 * Returns SQL positional placeholders to match a list of values against a column.
 * @param column matched column.
 * @param values number of matched values.
 */
export function whereIn(column: string, { length }: unknown[]) {
	return length ? `${column} IN (${new Array(length).fill('?').join(',')})` : ''
}

/**
 * Returns the INSERT statement to insert or update given table (which primary key is column "id") given a list of models.
 * @param table upserted table.
 * @param models in which column names are searched.
 */
export function buildUpsert(table: string, models: object[]) {
	if (models.length === 0) {
		throw new Error(`Can not upsert in ${table} without models`)
	}
	const uniqueColumns = new Set()
	for (const model of models) {
		for (const column of Object.keys(model)) {
			if (column !== 'id') {
				uniqueColumns.add(column)
			}
		}
	}
	const columns = Array.from(uniqueColumns)
	return `INSERT INTO ${table} (id, ${columns.join(', ')}) 
VALUES (:id, ${columns.map(col => `:${col}`).join(', ')})
ON CONFLICT(id) DO UPDATE SET
${columns.map(col => `${col}=coalesce(excluded.${col}, NULL)`).join(',\n')}`
}
