// query.ts — removed: sql.sql and attr.getBlockAttrs are registered elsewhere.
// This file is kept empty to avoid breaking imports. Use sql.sql or attr.getBlockAttrs instead.

import { registry } from '../../utils/registry.js';

export function registerQueryHandlers() {
    // No-op: duplicate handlers removed.
    // - SQL query: use sql.sql
    // - Block attrs: use attr.getBlockAttrs
}
