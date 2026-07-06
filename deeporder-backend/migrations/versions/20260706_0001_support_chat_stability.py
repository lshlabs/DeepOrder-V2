"""support chat stability tables and idempotent messages

Revision ID: 20260706_0001
Revises:
Create Date: 2026-07-06
"""

from alembic import op
import sqlalchemy as sa


revision = "20260706_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("support_messages", sa.Column("client_message_id", sa.String(length=64), nullable=True))
    op.create_index(
        "uq_support_message_client_id",
        "support_messages",
        ["conversation_id", "client_message_id"],
        unique=True,
    )

    op.create_table(
        "support_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("conversation_id", sa.Integer(), nullable=False),
        sa.Column("event_type", sa.String(length=64), nullable=False),
        sa.Column("payload_json", sa.JSON(), nullable=False),
        sa.Column("actor_type", sa.Enum("USER", "AGENT", "SYSTEM", name="supporteventactortype"), nullable=False),
        sa.Column("actor_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["actor_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["conversation_id"], ["support_conversations.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_support_events_actor_id"), "support_events", ["actor_id"], unique=False)
    op.create_index(op.f("ix_support_events_actor_type"), "support_events", ["actor_type"], unique=False)
    op.create_index(op.f("ix_support_events_conversation_id"), "support_events", ["conversation_id"], unique=False)
    op.create_index(op.f("ix_support_events_event_type"), "support_events", ["event_type"], unique=False)

    op.create_table(
        "support_agent_status",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("agent_id", sa.Integer(), nullable=False),
        sa.Column("store_id", sa.String(length=64), nullable=False),
        sa.Column(
            "status",
            sa.Enum("ONLINE", "OFFLINE", "BUSY", "AWAY", name="supportagentavailabilitystatus"),
            nullable=False,
        ),
        sa.Column("max_active_conversations", sa.Integer(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["agent_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["store_id"], ["stores.store_id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("agent_id", "store_id", name="uq_support_agent_status_agent_store"),
    )
    op.create_index(op.f("ix_support_agent_status_agent_id"), "support_agent_status", ["agent_id"], unique=False)
    op.create_index(op.f("ix_support_agent_status_status"), "support_agent_status", ["status"], unique=False)
    op.create_index(op.f("ix_support_agent_status_store_id"), "support_agent_status", ["store_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_support_agent_status_store_id"), table_name="support_agent_status")
    op.drop_index(op.f("ix_support_agent_status_status"), table_name="support_agent_status")
    op.drop_index(op.f("ix_support_agent_status_agent_id"), table_name="support_agent_status")
    op.drop_table("support_agent_status")

    op.drop_index(op.f("ix_support_events_event_type"), table_name="support_events")
    op.drop_index(op.f("ix_support_events_conversation_id"), table_name="support_events")
    op.drop_index(op.f("ix_support_events_actor_type"), table_name="support_events")
    op.drop_index(op.f("ix_support_events_actor_id"), table_name="support_events")
    op.drop_table("support_events")

    op.drop_index("uq_support_message_client_id", table_name="support_messages")
    op.drop_column("support_messages", "client_message_id")
