exports.up = pgm => {
  pgm.createTable('portfolio_admins', {
    id: { type: 'uuid', primaryKey: true },
    username: { type: 'varchar(80)', notNull: true, unique: true },
    email: { type: 'varchar(254)', notNull: true, unique: true },
    password_hash: { type: 'text', notNull: true },
    blocked: { type: 'boolean', notNull: true, default: false },
    token_version: { type: 'integer', notNull: true, default: 0 },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('current_timestamp') },
  });
  pgm.addConstraint('portfolio_admins', 'admin_username_normalized', { check: 'username = lower(username)' });
  pgm.addConstraint('portfolio_admins', 'admin_email_normalized', { check: 'email = lower(email)' });
};
exports.down = pgm => pgm.dropTable('portfolio_admins');
