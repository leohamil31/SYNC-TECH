const db = require('../db/connection');
const HttpError = require('../utils/http-error');

/**
 * Builds a CRUD service for a table.
 *
 * @param {object} options
 * @param {string} options.table        Table name.
 * @param {string} options.alias        Alias used in the read query.
 * @param {string} options.label        Human readable name used in error messages.
 * @param {(alias: string) => import('knex').Knex.QueryBuilder} [options.readQuery]
 *        Query used for list/get, allowing joins and computed columns.
 * @param {string[]} [options.searchColumns]  Columns matched by `?search=`.
 * @param {Record<string, string>} [options.filters] Query param -> qualified column.
 * @param {[string, 'asc'|'desc'][]} [options.orderBy]
 */
const createCrudService = ({
  table,
  alias,
  label,
  readQuery = (a) => db(`${table} as ${a}`).select(`${a}.*`),
  searchColumns = [],
  filters = {},
  orderBy = [[`${alias}.id`, 'asc']],
}) => {
  const applyFilters = (query, params) => {
    Object.entries(filters).forEach(([param, column]) => {
      if (params[param] !== undefined) query.where(column, params[param]);
    });
    if (params.search && searchColumns.length) {
      query.where((builder) => {
        searchColumns.forEach((column) => builder.orWhereILike(column, `%${params.search}%`));
      });
    }
    return query;
  };

  const list = async ({ page = 1, limit = 20, ...params } = {}) => {
    const filtered = applyFilters(readQuery(alias), params);

    const [{ total }] = await db.count('* as total').from(filtered.clone().as('filtered'));
    const query = filtered.offset((page - 1) * limit).limit(limit);
    orderBy.forEach(([column, direction]) => query.orderBy(column, direction));
    const data = await query;

    const totalItems = Number(total);
    return {
      data,
      meta: { page, limit, total: totalItems, total_pages: Math.ceil(totalItems / limit) },
    };
  };

  const findById = async (id) => {
    const record = await readQuery(alias).where(`${alias}.id`, id).first();
    if (!record) throw HttpError.notFound(`${label} ${id} not found`);
    return record;
  };

  const create = async (payload) => {
    const [{ id }] = await db(table).insert(payload).returning('id');
    return findById(id);
  };

  const update = async (id, payload) => {
    const affected = await db(table)
      .where({ id })
      .update({ ...payload, updated_at: db.fn.now() });
    if (!affected) throw HttpError.notFound(`${label} ${id} not found`);
    return findById(id);
  };

  const remove = async (id) => {
    const affected = await db(table).where({ id }).del();
    if (!affected) throw HttpError.notFound(`${label} ${id} not found`);
  };

  return { list, findById, create, update, remove };
};

module.exports = createCrudService;
