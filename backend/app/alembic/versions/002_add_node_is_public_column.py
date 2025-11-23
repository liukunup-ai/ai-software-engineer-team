"""Ensure node.is_public exists

Revision ID: 002_add_node_is_public_column
Revises: 001_initial_schema
Create Date: 2025-11-23 16:25:00.000000
"""
from alembic import op
import sqlalchemy as sa


revision = "002_add_node_is_public_column"
down_revision = "001_initial_schema"
branch_labels = None
depends_on = None


# NOTE: Alembic does not expose a built-in helper for conditional DDL, so we
# inspect the live schema first to keep the migration idempotent.
def _table_exists(table_name: str) -> bool:
    inspector = sa.inspect(op.get_bind())
    return table_name in inspector.get_table_names()


def _column_exists(table_name: str, column_name: str) -> bool:
    if not _table_exists(table_name):
        return False

    inspector = sa.inspect(op.get_bind())
    columns = [col["name"] for col in inspector.get_columns(table_name)]
    return column_name in columns


def upgrade() -> None:
    if not _table_exists("node") or _column_exists("node", "is_public"):
        return

    op.add_column(
        "node",
        sa.Column(
            "is_public",
            sa.Boolean(),
            nullable=False,
            server_default=sa.true(),
        ),
    )
    # Backfill new rows with the expected default and drop the server default
    # so application-level defaults remain the source of truth.
    op.execute(sa.text("UPDATE node SET is_public = TRUE WHERE is_public IS NULL"))
    op.alter_column("node", "is_public", server_default=None)


def downgrade() -> None:
    if not _column_exists("node", "is_public"):
        return

    op.drop_column("node", "is_public")
