from sqlalchemy.orm import Session
from app.models.education import ClassModel

DEFAULT_CLASSES = [
    {"name": "Class 6", "code": "class-6", "display_order": 1},
    {"name": "Class 7", "code": "class-7", "display_order": 2},
    {"name": "Class 8", "code": "class-8", "display_order": 3},
    {"name": "Class 9", "code": "class-9", "display_order": 4},
    {"name": "Class 10", "code": "class-10", "display_order": 5},
    {"name": "Class 11 (Science)", "code": "class-11-science", "display_order": 6},
    {"name": "Class 11 (Commerce)", "code": "class-11-commerce", "display_order": 7},
    {"name": "Class 11 (Arts)", "code": "class-11-arts", "display_order": 8},
    {"name": "Class 12 (Science)", "code": "class-12-science", "display_order": 9},
    {"name": "Class 12 (Commerce)", "code": "class-12-commerce", "display_order": 10},
    {"name": "Class 12 (Arts)", "code": "class-12-arts", "display_order": 11},
    {"name": "Undergraduate", "code": "ug", "display_order": 12},
    {"name": "Postgraduate", "code": "pg", "display_order": 13},
]


def seed_classes(db: Session) -> int:
    added = 0
    for cls_data in DEFAULT_CLASSES:
        existing = db.query(ClassModel).filter(ClassModel.code == cls_data["code"]).first()
        if not existing:
            cls_obj = ClassModel(**cls_data)
            db.add(cls_obj)
            added += 1
    db.commit()
    return added
