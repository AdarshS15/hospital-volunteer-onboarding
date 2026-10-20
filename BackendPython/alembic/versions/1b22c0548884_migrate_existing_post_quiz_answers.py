"""Migrate existing post quiz answers

Revision ID: 1b22c0548884
Revises: 
Create Date: 2026-10-18 23:49:39.271112

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '1b22c0548884'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    import json

    connection = op.get_bind()
    rows = connection.execute(sa.text("""
        SELECT id, module_answer_list, previous_answer_list
        FROM user_quiz_answers
        WHERE module_type = 'postQuiz'
    """)).mappings().all()

    for row in rows:
        current = json.loads(row["module_answer_list"] or "[]")
        previous = json.loads(row["previous_answer_list"] or "[]")

        if len(current) == 40 and any(a is not None for a in current) and not any(a is not None for a in previous):
            connection.execute(sa.text("""
                UPDATE user_quiz_answers
                SET previous_answer_list = :previous,
                    module_answer_list = :current
                WHERE id = :id
            """), {
                "previous": json.dumps(current),
                "current": json.dumps([None] * 40),
                "id": row["id"]
            })


def downgrade() -> None:
    pass
